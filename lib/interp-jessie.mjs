// DO NOT EDIT - Generated automatically from interp-jessie.mjs.ts by tessc
// TODO: Hoisting of functionDecls.
import qutils from './quasi-utils.mjs';
const BINDING_PARENT = 0;
const BINDING_NAME = 1;
const BINDING_GET = 2;
const BINDING_SET = 3;
const makeBinding = immunize((parent, name, init, mutable = true) => {
    let slot = init;
    const setter = mutable && ((val) => slot = val);
    return [parent, name, () => slot, setter];
});
const jsonEvaluators = immunize({
    array(self, elems) {
        const arr = elems.map(el => doEval(self, ...el));
        return arr;
    },
    data(self, val) {
        return val;
    },
    prop(self, name) {
        return name;
    },
    record(self, propDefs) {
        const obj = {};
        propDefs.forEach(b => {
            const [name, val] = doEval(self, ...b);
            self.setComputedIndex(obj, name, val);
        });
        return obj;
    },
});
const justinEvaluators = immunize({
    ...jsonEvaluators,
    'pre:+'(self, expr) {
        return +doEval(self, ...expr);
    },
    'pre:-'(self, expr) {
        return -doEval(self, ...expr);
    },
    'pre:~'(self, expr) {
        return ~doEval(self, ...expr);
    },
    'pre:!'(self, expr) {
        return !doEval(self, ...expr);
    },
    '**'(self, a, b) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval ** bval;
    },
    '*'(self, a, b) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval * bval;
    },
    '/'(self, a, b) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval / bval;
    },
    '%'(self, a, b) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval % bval;
    },
    '+'(self, a, b) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval + bval;
    },
    '-'(self, a, b) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval - bval;
    },
    '<<'(self, a, b) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval << bval;
    },
    '>>>'(self, a, b) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval >>> bval;
    },
    '>>'(self, a, b) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval >> bval;
    },
    '<='(self, a, b) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval <= bval;
    },
    '<'(self, a, b) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval < bval;
    },
    '>='(self, a, b) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval >= bval;
    },
    '>'(self, a, b) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval > bval;
    },
    '!=='(self, a, b) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval !== bval;
    },
    '==='(self, a, b) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval === bval;
    },
    '&'(self, a, b) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval & bval;
    },
    '^'(self, a, b) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval ^ bval;
    },
    '|'(self, a, b) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval | bval;
    },
    '&&'(self, a, b) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval && bval;
    },
    '||'(self, a, b) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval || bval;
    },
    array(self, elems) {
        const arr = elems.reduce((prior, el) => {
            const val = doEval(self, ...el);
            if (el[0] === 'spread') {
                for (const v of val) {
                    prior.push(v);
                }
            }
            else {
                prior.push(val);
            }
            return prior;
        }, []);
        return arr;
    },
    call(self, func, args) {
        const lambda = doEval(self, ...func);
        const evaledArgs = args.map((a) => doEval(self, ...a));
        return lambda(...evaledArgs);
    },
    cond(self, c, t, e) {
        const cval = doEval(self, ...c);
        if (cval) {
            return doEval(self, ...t);
        }
        return doEval(self, ...e);
    },
    def(self, name) {
        return name;
    },
    get(self, objExpr, id) {
        const obj = doEval(self, ...objExpr);
        return obj[id];
    },
    index(self, expr) {
        const val = doEval(self, ...expr);
        if (typeof val !== 'number') {
            slog.error(`Index value ${{ val }} is not numeric`);
        }
        return val;
    },
    quasi(self, parts) {
        const argsExpr = qutils.qrepack(parts);
        return argsExpr.map(arg => doEval(self, ...arg));
    },
    record(self, propDefs) {
        const obj = {};
        propDefs.forEach(b => {
            if (b[0] === 'spreadObj') {
                const spreader = doEval(self, ...b);
                for (const [name, val] of Object.entries(spreader)) {
                    self.setComputedIndex(obj, name, val);
                }
            }
            else {
                const [name, val] = doEval(self, ...b);
                self.setComputedIndex(obj, name, val);
            }
        });
        return obj;
    },
    spread(self, arrExpr) {
        const arr = doEval(self, ...arrExpr);
        return arr;
    },
    spreadObj(self, objExpr) {
        const obj = doEval(self, ...objExpr);
        return obj;
    },
    tag(self, tagExpr, quasiExpr) {
        const tag = doEval(self, ...tagExpr);
        const args = doEval(self, ...quasiExpr);
        return tag(...args);
    },
    typeof(self, expr) {
        try {
            const val = doEval(self, ...expr);
            return typeof val;
        }
        catch (e) {
            // Special semantics not to fail a plain 'use' on ReferenceError.
            if (expr[0] === 'use') {
                return undefined;
            }
            throw e;
        }
    },
    use(self, name) {
        let b = self.envp;
        while (b !== undefined) {
            if (b[BINDING_NAME] === name) {
                return b[BINDING_GET]();
            }
            b = b[BINDING_PARENT];
        }
        slog.error `ReferenceError: ${name} is not defined`;
    },
    void(self, expr) {
        doEval(self, ...expr);
        return undefined;
    },
});
const jessieEvaluators = immunize({
    ...justinEvaluators,
    arrow(self, argDefs, body) {
        return self.evaluators.lambda(self, argDefs, body);
    },
    bind(self, def, expr) {
        const name = doEval(self, ...def);
        const val = doEval(self, ...expr);
        return [name, val];
    },
    block(self, statements) {
        // Produce the final value.
        return statements.reduce((_, s) => doEval(self, ...s), undefined);
    },
    const(self, binds) {
        binds.forEach(b => {
            const [name, val] = doEval(self, ...b);
            self.envp = makeBinding(self.envp, name, val);
        });
    },
    functionDecl(self, def, argDefs, body) {
        const lambda = self.evaluators.lambda(self, argDefs, body);
        const name = doEval(self, ...def);
        self.envp = makeBinding(self.envp, name, lambda, true);
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
    index(self, expr) {
        // Indices in Jessie can be anything.
        return doEval(self, ...expr);
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
});
const doEval = immunize((self, ...astArgs) => {
    const [name, ...args] = astArgs;
    const ev = self.evaluators[name];
    if (!ev) {
        slog.error `No ${{ name }} implementation`;
    }
    return ev(self, ...args);
});
const doApply = immunize((self, args, formals, body) => {
    // Bind the formals.
    // TODO: Rest arguments.
    formals.forEach((f, i) => self.envp = makeBinding(self.envp, f, args[i]));
    // Evaluate the body.
    return doEval(self, ...body);
});
const makeInterpJessie = immunize((importer, setComputedIndex) => {
    function interpJessie(ast, endowments, options) {
        const lastSlash = options.scriptName === undefined ? -1 : options.scriptName.lastIndexOf('/');
        const thisDir = lastSlash < 0 ? '.' : options.scriptName.slice(0, lastSlash);
        const self = {
            dir: thisDir,
            evaluators: jessieEvaluators,
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
});
export default immunize(makeInterpJessie);
