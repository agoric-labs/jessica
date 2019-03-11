// TODO: Hoisting of functionDecls.
var Binding;
(function (Binding) {
    Binding[Binding["parent"] = 0] = "parent";
    Binding[Binding["name"] = 1] = "name";
    Binding[Binding["getter"] = 2] = "getter";
    Binding[Binding["setter"] = 3] = "setter";
})(Binding || (Binding = {}));
function makeConstBinding(self, name, init) {
    return harden([self.envp, name, () => init]);
}
function makeMutableBinding(self, name, init) {
    let slot = init;
    return harden([self.envp, name,
        () => slot, (val) => slot = val,
    ]);
}
function makeBinding(self, name, init, mutable = true) {
    let slot = init;
    const setter = mutable && ((val) => slot = val);
    return harden([self.envp, name, () => slot, setter]);
}
const evaluators = {
    bind(self, def, expr) {
        const name = doEval(self, ...def);
        const val = doEval(self, ...expr);
        self.envp = makeBinding(self, name, val);
    },
    block(self, statements) {
        // Produce the final value.
        return statements.reduce((_, s) => doEval(self, ...s), undefined);
    },
    call(self, func, args) {
        const lambda = doEval(self, ...func);
        if (typeof lambda !== 'function') {
            slog.error `Expected a function, not ${{ lambda }}`;
        }
        const evaledArgs = args.map((a) => doEval(self, ...a));
        return lambda(...evaledArgs);
    },
    const(self, binds) {
        binds.forEach(b => doEval(self, ...b));
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
        self.envp = makeBinding(self, name, lambda);
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
        self.envp = makeBinding(self, name, val);
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
    use(self, name) {
        let b = self.envp;
        while (b !== undefined) {
            if (b[Binding.name] === name) {
                return b[Binding.getter]();
            }
            b = b[Binding.parent];
        }
        slog.error `Cannot find binding for ${name} in current scope`;
    },
};
function doEval(self, ...astArgs) {
    const [name, ...args] = astArgs;
    const ee = evaluators[name];
    if (!ee) {
        slog.error `No ${{ name }} implementation`;
    }
    const oldEvalStack = self.evalStack;
    try {
        self.evalStack = [name, self.evalStack];
        return ee(self, ...args);
    }
    finally {
        self.evalStack = oldEvalStack;
    }
}
function doApply(self, args, formals, body) {
    // Bind the formals.
    // TODO: Rest arguments.
    formals.forEach((f, i) => self.envp = makeMutableBinding(self, f, args[i]));
    // Evaluate the body.
    return doEval(self, ...body);
}
function makeInterpJessie(importer) {
    function interpJessie(ast, endowments, options) {
        const lastSlash = options.scriptName === undefined ? -1 : options.scriptName.lastIndexOf('/');
        const thisDir = lastSlash < 0 ? '.' : options.scriptName.slice(0, lastSlash);
        const self = {
            dir: thisDir,
            import: (path) => importer(path, (iast) => interpJessie(iast, endowments, { scriptName: path })),
        };
        // slog.info`AST: ${{ast}}`;
        for (const [name, value] of Object.entries(endowments)) {
            // slog.info`Adding ${name}, ${value} to bindings`;
            self.envp = makeConstBinding(self, name, value);
        }
        return doEval(self, ...ast);
    }
    return harden(interpJessie);
}
export default harden(makeInterpJessie);
