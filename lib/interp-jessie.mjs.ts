// TODO: Hoisting of functionDecls.

import justinEvaluators from './interp-justin.mjs';
import {BINDING_GET, BINDING_NAME, BINDING_PARENT, BINDING_SET, doApply, doEval,
    Evaluator, IEvalContext, IEvalOptions, makeBinding} from './interp-utils.mjs';

const getBinding = (self: IEvalContext, ...astNode: any[]) => {
    const [name, ...args] = astNode;
    switch (name) {
    case 'use': {
        const vname = args[0];
        let b = self.envp;
        while (b) {
            if (b[BINDING_NAME] === vname) {
                return {setter: b[BINDING_SET], getter: b[BINDING_GET]};
            }
            b = b[BINDING_PARENT];
        }
        break;
    }

    case 'get': {
        const [pe, id] = args;
        const obj = doEval(self, ...pe);
        return {setter: (val: any) => self.setComputedIndex(obj, id, val), getter: () => obj[id]};
    }

    case 'index': {
        const [pe, e] = args;
        const obj = doEval(self, ...pe);
        const index = doEval(self, ...e);
        return {setter: (val: any) => self.setComputedIndex(obj, index, val), getter: () => obj[index]};
    }

    case 'indexLater':
    case 'getLater':
        // TODO: Implement when described properly.
    }
    slog.error`Cannot find binding for node ${{name}}`;
};

const jessieEvaluators: Record<string, Evaluator> = {
    ...justinEvaluators,
    '='(self: IEvalContext, lValue: any[], rValue: any[]) {
        const val = doEval(self, ...rValue);
        const {setter} = getBinding(self, ...lValue);
        return setter(val);
    },
    '*='(self: IEvalContext, lValue: any[], rValue: any[]) {
        const val = doEval(self, ...rValue);
        const {getter, setter} = getBinding(self, ...lValue);
        return setter(getter() * val);
    },
    '/='(self: IEvalContext, lValue: any[], rValue: any[]) {
        const val = doEval(self, ...rValue);
        const {getter, setter} = getBinding(self, ...lValue);
        return setter(getter() / val);
    },
    '%='(self: IEvalContext, lValue: any[], rValue: any[]) {
        const val = doEval(self, ...rValue);
        const {getter, setter} = getBinding(self, ...lValue);
        return setter(getter() % val);
    },
    '+='(self: IEvalContext, lValue: any[], rValue: any[]) {
        const val = doEval(self, ...rValue);
        const {getter, setter} = getBinding(self, ...lValue);
        return setter(getter() + val);
    },
    '-='(self: IEvalContext, lValue: any[], rValue: any[]) {
        const val = doEval(self, ...rValue);
        const {getter, setter} = getBinding(self, ...lValue);
        return setter(getter() - val);
    },
    '<<='(self: IEvalContext, lValue: any[], rValue: any[]) {
        const val = doEval(self, ...rValue);
        const {getter, setter} = getBinding(self, ...lValue);
        return setter(getter() << val);
    },
    '>>='(self: IEvalContext, lValue: any[], rValue: any[]) {
        const val = doEval(self, ...rValue);
        const {getter, setter} = getBinding(self, ...lValue);
        return setter(getter() >> val);
    },
    '>>>='(self: IEvalContext, lValue: any[], rValue: any[]) {
        const val = doEval(self, ...rValue);
        const {getter, setter} = getBinding(self, ...lValue);
        return setter(getter() >>> val);
    },
    '&='(self: IEvalContext, lValue: any[], rValue: any[]) {
        const val = doEval(self, ...rValue);
        const {getter, setter} = getBinding(self, ...lValue);
        return setter(getter() & val);
    },
    '^='(self: IEvalContext, lValue: any[], rValue: any[]) {
        const val = doEval(self, ...rValue);
        const {getter, setter} = getBinding(self, ...lValue);
        return setter(getter() ^ val);
    },
    '|='(self: IEvalContext, lValue: any[], rValue: any[]) {
        const val = doEval(self, ...rValue);
        const {getter, setter} = getBinding(self, ...lValue);
        return setter(getter() | val);
    },
    '**='(self: IEvalContext, lValue: any[], rValue: any[]) {
        const val = doEval(self, ...rValue);
        const {getter, setter} = getBinding(self, ...lValue);
        return setter(getter() ** val);
    },
    arrow(self: IEvalContext, argDefs: any[][], body: any[]) {
        return self.evaluators.lambda(self, argDefs, body);
    },
    bind(self: IEvalContext, def, expr) {
        const name = doEval(self, ...def);
        const val = doEval(self, ...expr);
        return [name, val];
    },
    block(self: IEvalContext, statements: any[][]) {
        // Produce the final value.
        return statements.reduce<any>((_, s) => doEval(self, ...s), undefined);
    },
    const(self: IEvalContext, binds: any[][]) {
        binds.forEach(b => {
            const [name, val] = doEval(self, ...b);
            self.envp = makeBinding(self.envp, name, val);
        });
    },
    functionDecl(self: IEvalContext, def: any[], argDefs: any[][], body: any[]) {
        const lambda = self.evaluators.lambda(self, argDefs, body);
        const name = doEval(self, ...def);
        self.envp = makeBinding(self.envp, name, lambda, true);
    },
    if(self: IEvalContext, c: any[], t: any[], e: any[]) {
        const cval = doEval(self, ...c);
        if (cval) {
            doEval(self, ...t);
        } else if (e) {
            doEval(self, ...e);
        }
    },
    import(self: IEvalContext, def: any[], path: string) {
        const name = doEval(self, ...def);
        if (path[0] === '.' && path[1] === '/') {
            // Take the input relative to our current directory.
            path = `${self.dir}${path.slice(1)}`;
        }

        // Interpret with the same endowments.
        const val = self.import(path);
        self.envp = makeBinding(self.envp, name, val);
    },
    index(self: IEvalContext, expr: any[]) {
        // Indices in Jessie can be anything.
        return doEval(self, ...expr);
    },
    lambda(self: IEvalContext, argDefs: any[][], body: any[]) {
        // FIXME: Handle rest and default arguments.
        const formals = argDefs.map(adef => doEval(self, ...adef));
        const selfCopy = {...self};
        const lambda = (...args: any[]) => {
            return doApply(selfCopy, args, formals, body);
        };
        return lambda;
    },
    module(self: IEvalContext, body: any[]) {
        const oldEnv = self.envp;
        try {
            let didExport = false, exported: any;
            for (const stmt of body) {
                if (stmt[0] === 'exportDefault') {
                    // Handle this production explicitly.
                    if (didExport) {
                        slog.error`Cannot use more than one "export default" statement`;
                    }
                    exported = doEval(self, ...stmt[1]);
                    didExport = true;
                } else {
                    doEval(self, ...stmt);
                }
            }
            return exported;
        } finally {
            self.envp = oldEnv;
        }
    },
};

export default jessieEvaluators;
