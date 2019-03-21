// TODO: Hoisting of functionDecls.
const BINDING_PARENT = 0;
const BINDING_NAME = 1;
const BINDING_GET = 2;
const BINDING_SET = 3;
const makeBinding = (parent, name, init, mutable = true) => {
    let slot = init;
    const setter = mutable && ((val) => slot = val);
    return [parent, name, () => slot, setter];
};
const evaluators = {
    bind(self, def, expr) {
        const name = doEval(self, ...def);
        const val = doEval(self, ...expr);
        return [name, val];
    },
    block(self, statements) {
        // Produce the final value.
        return statements.reduce((_, s) => doEval(self, ...s), undefined);
    },
    call(self, func, args) {
        const lambda = doEval(self, ...func);
        const evaledArgs = args.map((a) => doEval(self, ...a));
        return lambda(...evaledArgs);
    },
    const(self, binds) {
        binds.forEach(b => {
            const [name, val] = doEval(self, ...b);
            self.envp = makeBinding(self.envp, name, val);
        });
    },
    data(self, val) {
        return val;
    },
    def(self, name) {
        return name;
    },
    functionDecl(self, def, argDefs, body) {
        const lambda = evaluators.lambda(self, argDefs, body);
        const name = doEval(self, ...def);
        self.envp = makeBinding(self.envp, name, lambda, true);
    },
    get(self, objExpr, index) {
        const obj = doEval(self, ...objExpr);
        return obj[index];
    },
    import(self, def, path) {
        const name = doEval(self, ...def);
        if (path[0] === '.' && path[1] === '/') {
            // Take the input relative to our current directory.
            path = `${self.dir}${path.slice(1)}`;
        }
        // Interpret with the same endowments.
        const val = self.import(path);
        self.envp = makeBinding(self.envp, name, val);
    },
    lambda(self, argDefs, body) {
        // FIXME: Handle rest and default arguments.
        const formals = argDefs.map(adef => doEval(self, ...adef));
        const selfCopy = { ...self };
        const lambda = (...args) => {
            return doApply(selfCopy, args, formals, body);
        };
        return lambda;
    },
    module(self, body) {
        const oldEnv = self.envp;
        try {
            let didExport = false, exported;
            for (const stmt of body) {
                if (stmt[0] === 'exportDefault') {
                    // Handle this production explicitly.
                    if (didExport) {
                        slog.error `Cannot use more than one "export default" statement`;
                    }
                    exported = doEval(self, ...stmt[1]);
                    didExport = true;
                }
                else {
                    doEval(self, ...stmt);
                }
            }
            return exported;
        }
        finally {
            self.envp = oldEnv;
        }
    },
    record(self, propDefs) {
        const obj = {};
        propDefs.forEach(b => {
            const [name, val] = doEval(self, ...b);
            self.setComputedIndex(obj, name, val);
        });
        return obj;
    },
    use(self, name) {
        let b = self.envp;
        while (b !== undefined) {
            if (b[BINDING_NAME] === name) {
                return b[BINDING_GET]();
            }
            b = b[BINDING_PARENT];
        }
        slog.error `Cannot find binding for ${name} in current scope`;
    },
};
const doEval = (self, ...astArgs) => {
    const [name, ...args] = astArgs;
    const ev = evaluators[name];
    if (!ev) {
        slog.error `No ${{ name }} implementation`;
    }
    return ev(self, ...args);
};
const doApply = (self, args, formals, body) => {
    // Bind the formals.
    // TODO: Rest arguments.
    formals.forEach((f, i) => self.envp = makeBinding(self.envp, f, args[i]));
    // Evaluate the body.
    return doEval(self, ...body);
};
const makeInterpJessie = (importer, setComputedIndex) => {
    function interpJessie(ast, endowments, options) {
        const lastSlash = options.scriptName === undefined ? -1 : options.scriptName.lastIndexOf('/');
        const thisDir = lastSlash < 0 ? '.' : options.scriptName.slice(0, lastSlash);
        const self = {
            dir: thisDir,
            import: (path) => importer(path, (iast) => interpJessie(iast, endowments, { scriptName: path })),
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
