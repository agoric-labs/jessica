// TODO: Hoisting of functionDecls.

import qutils from './quasi-utils.mjs';

interface IEvalOptions {
    [key: string]: any;
    scriptName?: string;
}

type Evaluator = (self: IEvalContext, ...args: any[]) => any;

const BINDING_PARENT = 0;
const BINDING_NAME = 1;
const BINDING_GET = 2;
const BINDING_SET = 3;

interface IBinding {
    [BINDING_PARENT]: IBinding | undefined;
    [BINDING_NAME]: string;
    [BINDING_GET]: () => any;
    [BINDING_SET]?: (val: any) => typeof val;
}

interface IEvalContext {
    setComputedIndex: (obj: Record<string | number, any>, key: string | number, val: any) => void;
    dir: string;
    envp?: Immune<IBinding>;
    evaluators: Record<string, Evaluator>;
    import: (path: string) => any;
}

const makeBinding = (parent: IBinding, name: string, init?: any, mutable = true): IBinding => {
    let slot = init;
    const setter = mutable && ((val: any) => slot = val);
    return [parent, name, () => slot, setter];
};

const jsonEvaluators: Record<string, Evaluator> = {
    array(self: IEvalContext, elems: any[][]) {
        const arr = elems.map(el => doEval(self, ...el));
        return arr;
    },
    data(self: IEvalContext, val: any) {
        return val;
    },
    prop(self: IEvalContext, name: string) {
        return name;
    },
    record(self: IEvalContext, propDefs: any[][]) {
        const obj: Record<string | number, any> = {};
        propDefs.forEach(b => {
            const [name, val] = doEval(self, ...b);
            self.setComputedIndex(obj, name, val);
        });
        return obj;
    },
};

const justinEvaluators: Record<string, Evaluator> = {
    ...jsonEvaluators,
    'pre:+'(self: IEvalContext, expr: any[]) {
        return +doEval(self, ...expr);
    },
    'pre:-'(self: IEvalContext, expr: any[]) {
        return -doEval(self, ...expr);
    },
    'pre:~'(self: IEvalContext, expr: any[]) {
        return ~doEval(self, ...expr);
    },
    'pre:!'(self: IEvalContext, expr: any[]) {
        return !doEval(self, ...expr);
    },
    '**'(self: IEvalContext, a: any[], b: any[]) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval ** bval;
    },
    '*'(self: IEvalContext, a: any[], b: any[]) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval * bval;
    },
    '/'(self: IEvalContext, a: any[], b: any[]) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval / bval;
    },
    '%'(self: IEvalContext, a: any[], b: any[]) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval % bval;
    },
    '+'(self: IEvalContext, a: any[], b: any[]) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval + bval;
    },
    '-'(self: IEvalContext, a: any[], b: any[]) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval - bval;
    },
    '<<'(self: IEvalContext, a: any[], b: any[]) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval << bval;
    },
    '>>>'(self: IEvalContext, a: any[], b: any[]) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval >>> bval;
    },
    '>>'(self: IEvalContext, a: any[], b: any[]) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval >> bval;
    },
    '<='(self: IEvalContext, a: any[], b: any[]) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval <= bval;
    },
    '<'(self: IEvalContext, a: any[], b: any[]) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval < bval;
    },
    '>='(self: IEvalContext, a: any[], b: any[]) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval >= bval;
    },
    '>'(self: IEvalContext, a: any[], b: any[]) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval > bval;
    },
    '!=='(self: IEvalContext, a: any[], b: any[]) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval !== bval;
    },
    '==='(self: IEvalContext, a: any[], b: any[]) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval === bval;
    },
    '&'(self: IEvalContext, a: any[], b: any[]) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval & bval;
    },
    '^'(self: IEvalContext, a: any[], b: any[]) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval ^ bval;
    },
    '|'(self: IEvalContext, a: any[], b: any[]) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval | bval;
    },
    '&&'(self: IEvalContext, a: any[], b: any[]) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval && bval;
    },
    '||'(self: IEvalContext, a: any[], b: any[]) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval || bval;
    },
    array(self: IEvalContext, elems: any[][]) {
        const arr = elems.reduce((prior, el) => {
            const val = doEval(self, ...el);
            if (el[0] === 'spread') {
                for (const v of val) {
                    prior.push(v);
                }
            } else {
                prior.push(val);
            }
            return prior;
        }, []);
        return arr;
    },
    call(self: IEvalContext, func: any[], args: any[][]) {
        const lambda = doEval(self, ...func);
        const evaledArgs = args.map((a) => doEval(self, ...a));
        return lambda(...evaledArgs);
    },
    cond(self: IEvalContext, c: any[], t: any[], e: any[]) {
        const cval = doEval(self, ...c);
        if (cval) {
            return doEval(self, ...t);
        }
        return doEval(self, ...e);
    },
    def(self: IEvalContext, name: string) {
        return name;
    },
    get(self: IEvalContext, objExpr: any[], id: string) {
        const obj = doEval(self, ...objExpr);
        return obj[id];
    },
    index(self: IEvalContext, expr: any[]) {
        const val = doEval(self, ...expr);
        if (typeof val !== 'number') {
            slog.error(`Index value ${{val}} is not numeric`);
        }
        return val;
    },
    quasi(self: IEvalContext, parts: any[]) {
        const argsExpr = qutils.qrepack(parts);
        return argsExpr.map(arg => doEval(self, ...arg));
    },
    record(self: IEvalContext, propDefs: any[][]) {
        const obj: Record<string | number, any> = {};
        propDefs.forEach(b => {
            if (b[0] === 'spreadObj') {
                const spreader = doEval(self, ...b);
                for (const [name, val] of Object.entries(spreader)) {
                    self.setComputedIndex(obj, name, val);
                }
            } else {
                const [name, val] = doEval(self, ...b);
                self.setComputedIndex(obj, name, val);
            }
        });
        return obj;
    },
    spread(self: IEvalContext, arrExpr: any[][]) {
        const arr = doEval(self, ...arrExpr);
        return arr;
    },
    spreadObj(self: IEvalContext, objExpr: any[]) {
        const obj = doEval(self, ...objExpr);
        return obj;
    },
    tag(self: IEvalContext, tagExpr: any[], quasiExpr: any[]) {
        const tag = doEval(self, ...tagExpr);
        const args = doEval(self, ...quasiExpr);
        return tag(...args);
    },
    typeof(self: IEvalContext, expr: any[]) {
        try {
            const val = doEval(self, ...expr);
            return typeof val;
        } catch (e) {
            // Special semantics not to fail a plain 'use' on ReferenceError.
            if (expr[0] === 'use') {
                return undefined;
            }
            throw e;
        }
    },
    use(self: IEvalContext, name: string) {
        let b = self.envp;
        while (b !== undefined) {
            if (b[BINDING_NAME] === name) {
                return b[BINDING_GET]();
            }
            b = b[BINDING_PARENT];
        }
        slog.error`ReferenceError: ${name} is not defined`;
    },
    void(self: IEvalContext, expr: any[]) {
        doEval(self, ...expr);
        return undefined;
    },
};

const jessieEvaluators: Record<string, Evaluator> = {
    ...justinEvaluators,
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

const doEval = (self: IEvalContext, ...astArgs: any[]) => {
    const [name, ...args] = astArgs;
    const ev = self.evaluators[name];
    if (!ev) {
        slog.error`No ${{name}} implementation`;
    }
    return ev(self, ...args);
};

const doApply = (self: IEvalContext, args: any[], formals: string[], body: any[]) => {
    // Bind the formals.
    // TODO: Rest arguments.
    formals.forEach((f, i) => self.envp = makeBinding(self.envp, f, args[i]));

    // Evaluate the body.
    return doEval(self, ...body);
};

const makeInterpJessie = (
    importer: (path: string, evaluator: (ast: any[]) => any) => any,
    setComputedIndex: (obj: Record<string | number, any>, index: string | number, value: any) => void) => {
    function interpJessie(ast: any[], endowments: Record<string, any>, options?: IEvalOptions): any {
        const lastSlash = options.scriptName === undefined ? -1 : options.scriptName.lastIndexOf('/');
        const thisDir = lastSlash < 0 ? '.' : options.scriptName.slice(0, lastSlash);

        const self: IEvalContext = {
            dir: thisDir,
            evaluators: jessieEvaluators,
            import: (path) =>
                importer(path, (iast: any[]) => interpJessie(iast, endowments, {scriptName: path})),
            setComputedIndex,
        };

        // slog.info`AST: ${{ast}}`;
        for (const [name, value] of Object.entries(endowments)) {
            // slog.info`Adding ${name}, ${value} to bindings`;
            self.envp = makeBinding(self.envp, name, value);
        }
        return doEval(self, ...ast);
    }

    return interpJessie;
};

export default makeInterpJessie;
