// TODO: Hoisting of functionDecls.

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

interface IEval {
    0: string;
    1: IEval;
}

interface IEvalContext {
    dir: string;
    evalStack?: Hardened<IEval>;
    envp?: Hardened<IBinding>;
    import: (path: string) => any;
}

function makeBinding(self: IEvalContext, name: string, init?: any, mutable = true) {
    let slot = init;
    const setter = mutable && ((val: any) => slot = val);
    return harden<IBinding>([self.envp, name, () => slot, setter]);
}

const evaluators: Record<string, Evaluator> = {
    bind(self: IEvalContext, def, expr) {
        const name = doEval(self, ...def);
        const val = doEval(self, ...expr);
        return [name, val];
    },
    block(self: IEvalContext, statements: any[][]) {
        // Produce the final value.
        return statements.reduce<any>((_, s) => doEval(self, ...s), undefined);
    },
    call(self: IEvalContext, func: any[], args: any[][]) {
        const lambda = doEval(self, ...func);
        if (typeof lambda !== 'function') {
            slog.error`Expected a function, not ${{lambda}}`;
        }
        const evaledArgs = args.map((a) => doEval(self, ...a));
        return lambda(...evaledArgs);
    },
    const(self: IEvalContext, binds: any[][]) {
        binds.forEach(b => {
            const [name, val] = doEval(self, ...b);
            self.envp = makeBinding(self, name, val);
        });
    },
    data(self: IEvalContext, val: any) {
        return val;
    },
    def(self: IEvalContext, name: string) {
        return name;
    },
    functionDecl(self: IEvalContext, def: any[], argDefs: any[][], body: any[]) {
        const lambda = evaluators.lambda(self, argDefs, body);
        const name = doEval(self, ...def);
        self.envp = makeBinding(self, name, lambda, true);
    },
    get(self: IEvalContext, objExpr: any[], index: any) {
        const obj = doEval(self, ...objExpr);
        return obj[index];
    },
    import(self: IEvalContext, def: any[], path: string) {
        const name = doEval(self, ...def);
        if (path[0] === '.' && path[1] === '/') {
            // Take the input relative to our current directory.
            path = `${self.dir}${path.slice(1)}`;
        }

        // Interpret with the same endowments.
        const val = self.import(path);
        self.envp = makeBinding(self, name, val);
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
    use(self: IEvalContext, name: string) {
        let b = self.envp;
        while (b !== undefined) {
            if (b[BINDING_NAME] === name) {
                return b[BINDING_GET]();
            }
            b = b[BINDING_PARENT];
        }
        slog.error`Cannot find binding for ${name} in current scope`;
    },
};

function doEval(self: IEvalContext, ...astArgs: any[]) {
    const [name, ...args] = astArgs;
    const ee = evaluators[name];
    if (!ee) {
        slog.error`No ${{name}} implementation`;
    }
    const oldEvalStack = self.evalStack;
    try {
        self.evalStack = [name, self.evalStack];
        return ee(self, ...args);
    } finally {
        self.evalStack = oldEvalStack;
    }
}

function doApply(self: IEvalContext, args: any[], formals: string[], body: any[]) {
    // Bind the formals.
    // TODO: Rest arguments.
    formals.forEach((f, i) => self.envp = makeBinding(self, f, args[i]));

    // Evaluate the body.
    return doEval(self, ...body);
}

function makeInterpJessie(importer: (path: string, evaluator: (ast: any[]) => any) => any) {
    function interpJessie(ast: any[], endowments: Record<string, any>, options?: IEvalOptions): any {
        const lastSlash = options.scriptName === undefined ? -1 : options.scriptName.lastIndexOf('/');
        const thisDir = lastSlash < 0 ? '.' : options.scriptName.slice(0, lastSlash);

        const self: IEvalContext = {
            dir: thisDir,
            import: (path: string) =>
                importer(path, (iast: any[]) => interpJessie(iast, endowments, {scriptName: path})),
        };

        // slog.info`AST: ${{ast}}`;
        for (const [name, value] of Object.entries(endowments)) {
            // slog.info`Adding ${name}, ${value} to bindings`;
            self.envp = makeBinding(self, name, value);
        }
        return doEval(self, ...ast);
    }

    return harden(interpJessie);
}

export default harden(makeInterpJessie);
