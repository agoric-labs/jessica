// TODO: Hoisting of functionDecls.

import justinEvaluators from './interp-justin.mjs';
import {BINDING_GET, BINDING_NAME, BINDING_PARENT, BINDING_SET, doEval,
    Evaluator, IEvalContext, IEvalOptions, makeBinding} from './interp-utils.mjs';

const MAGIC_EXIT = {toString: () => 'MAGIC_EXIT'};

const getRef = (self: IEvalContext, ...astNode: any[]) => {
    const [name, ...args] = astNode;
    const actual = name === 'use' ? 'ref' : name;
    return doEval(self, actual, ...args);
};

const doApply = (self: IEvalContext, args: any[], formals: string[], body: any[]) => {
    // Bind the formals.
    // TODO: Rest arguments.
    formals.forEach((f, i) => self.envp = makeBinding(self.envp, f, args[i]));

    // Evaluate the body.
    try {
        return doEval(self, ...body);
    } catch (e) {
        if (Array.isArray(e) && e[0] === MAGIC_EXIT) {
            if (e[1] === 'return') {
                // Some part of the body executed `return`;
                return e[2];
            } else {
                slog.error`Invalid exit kind ${{e: e[1]}}`;
            }
        }
        // Not a magic value, just throw normally.
        throw e;
    }
};

const jessieEvaluators: Record<string, Evaluator> = {
    ...justinEvaluators,
    '='(self: IEvalContext, lValue: any[], rValue: any[]) {
        const {setter} = getRef(self, ...lValue);
        const val = doEval(self, ...rValue);
        return setter(val);
    },
    '*='(self: IEvalContext, lValue: any[], rValue: any[]) {
        const {getter, setter} = getRef(self, ...lValue);
        const val = doEval(self, ...rValue);
        return setter(getter() * val);
    },
    '/='(self: IEvalContext, lValue: any[], rValue: any[]) {
        const {getter, setter} = getRef(self, ...lValue);
        const val = doEval(self, ...rValue);
        return setter(getter() / val);
    },
    '%='(self: IEvalContext, lValue: any[], rValue: any[]) {
        const {getter, setter} = getRef(self, ...lValue);
        const val = doEval(self, ...rValue);
        return setter(getter() % val);
    },
    '+='(self: IEvalContext, lValue: any[], rValue: any[]) {
        const {getter, setter} = getRef(self, ...lValue);
        const val = doEval(self, ...rValue);
        return setter(getter() + val);
    },
    '-='(self: IEvalContext, lValue: any[], rValue: any[]) {
        const {getter, setter} = getRef(self, ...lValue);
        const val = doEval(self, ...rValue);
        return setter(getter() - val);
    },
    '<<='(self: IEvalContext, lValue: any[], rValue: any[]) {
        const {getter, setter} = getRef(self, ...lValue);
        const val = doEval(self, ...rValue);
        return setter(getter() << val);
    },
    '>>='(self: IEvalContext, lValue: any[], rValue: any[]) {
        const {getter, setter} = getRef(self, ...lValue);
        const val = doEval(self, ...rValue);
        return setter(getter() >> val);
    },
    '>>>='(self: IEvalContext, lValue: any[], rValue: any[]) {
        const {getter, setter} = getRef(self, ...lValue);
        const val = doEval(self, ...rValue);
        return setter(getter() >>> val);
    },
    '&='(self: IEvalContext, lValue: any[], rValue: any[]) {
        const {getter, setter} = getRef(self, ...lValue);
        const val = doEval(self, ...rValue);
        return setter(getter() & val);
    },
    '^='(self: IEvalContext, lValue: any[], rValue: any[]) {
        const {getter, setter} = getRef(self, ...lValue);
        const val = doEval(self, ...rValue);
        return setter(getter() ^ val);
    },
    '|='(self: IEvalContext, lValue: any[], rValue: any[]) {
        const {getter, setter} = getRef(self, ...lValue);
        const val = doEval(self, ...rValue);
        return setter(getter() | val);
    },
    '**='(self: IEvalContext, lValue: any[], rValue: any[]) {
        const {getter, setter} = getRef(self, ...lValue);
        const val = doEval(self, ...rValue);
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
    get(self: IEvalContext, pe: any[], index: string) {
        const obj = doEval(self, ...pe);
        return {
            getter: () => obj[index],
            setter: (val: any) => self.setComputedIndex(obj, index, val),
            thisObj: obj
        };
    },
    index(self: IEvalContext, pe: any[], e: any[]) {
        const obj = doEval(self, ...pe);
        const index = doEval(self, ...e);
        return {
            getter: () => obj[index],
            setter: (val: any) => self.setComputedIndex(obj, index, val),
            thisObj: obj,
        };
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
    ref(self: IEvalContext, name: string) {
        let b = self.envp;
        while (b !== undefined) {
            if (b[BINDING_NAME] === name) {
                return {getter: b[BINDING_GET], setter: b[BINDING_SET], thisObj: undefined};
            }
            b = b[BINDING_PARENT];
        }
        slog.error`ReferenceError: ${{name}} is not defined`;
    },
};

export default jessieEvaluators;
