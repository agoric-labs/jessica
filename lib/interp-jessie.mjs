// DO NOT EDIT - Generated automatically from interp-jessie.mjs.ts by tessc
// TODO: Hoisting of functionDecls.
import justinEvaluators from './interp-justin.mjs';
import { addBinding, BINDING_GET, BINDING_NAME, BINDING_PARENT, BINDING_SET, doEval, err } from './interp-utils.mjs';
const MAGIC_EXIT = immunize({ toString: () => 'MAGIC_EXIT' });
const getRef = immunize((self, ...astNode) => {
    const [name] = astNode;
    if (name === 'use') {
        return doEval(self, astNode, 'ref');
    }
    return doEval(self, astNode);
});
const matchPattern = immunize((self, pattern, value) => {
    const pos = pattern._pegPosition;
    const oldPos = self.pos(pos);
    try {
        switch (pattern[0]) {
            case 'def': {
                return [[pattern[1], value]];
            }
            case 'matchData': {
                if (value === pattern[1]) {
                    return [];
                }
                err(self) `Failed matchData not implemented`;
            }
            case 'matchArray': {
                return pattern.slice(1).reduce((prior, pat, i) => {
                    matchPattern(self, pat, value[i])
                        .forEach(binding => prior.push(binding));
                    return prior;
                }, []);
            }
            case 'matchRecord': {
                return pattern.slice(1).reduce((prior, [name, pat]) => {
                    matchPattern(self, pat, value[name])
                        .forEach(binding => prior.push(binding));
                    return prior;
                }, []);
            }
            default: {
                err(self) `Cannot match ${{ pattern }}: not implemented`;
            }
        }
    }
    finally {
        self.pos(oldPos);
    }
});
const bindPattern = immunize((self, pattern, mutable, value) => {
    matchPattern(self, pattern, value).forEach((binding) => {
        const [name, val] = binding;
        addBinding(self, name, mutable, val);
    });
});
const doApply = immunize((self, args, bindings, body) => {
    const oldEnv = self.env();
    try {
        // Bind the arguments.
        const pattern = ['matchArray', ...bindings];
        bindPattern(self, pattern, true, args);
        // Evaluate the body.
        try {
            return doEval(self, body);
        }
        catch (e) {
            if (Array.isArray(e) && e[0] === MAGIC_EXIT) {
                if (e[1] === 'return') {
                    // Some part of the body executed `return`;
                    return e[2];
                }
                else {
                    err(self) `Invalid function exit kind ${{ e: e[1] }}`;
                }
            }
            // Not a magic value, just throw normally.
            throw e;
        }
    }
    finally {
        self.env(oldEnv);
    }
});
const jessieEvaluators = immunize({
    ...justinEvaluators,
    '='(self, lValue, rValue) {
        const { setter } = getRef(self, lValue);
        const val = doEval(self, rValue);
        return setter(val);
    },
    '*='(self, lValue, rValue) {
        const { getter, setter } = getRef(self, lValue);
        const val = doEval(self, rValue);
        return setter(getter() * val);
    },
    '/='(self, lValue, rValue) {
        const { getter, setter } = getRef(self, lValue);
        const val = doEval(self, rValue);
        return setter(getter() / val);
    },
    '%='(self, lValue, rValue) {
        const { getter, setter } = getRef(self, lValue);
        const val = doEval(self, rValue);
        return setter(getter() % val);
    },
    '+='(self, lValue, rValue) {
        const { getter, setter } = getRef(self, lValue);
        const val = doEval(self, rValue);
        return setter(getter() + val);
    },
    '-='(self, lValue, rValue) {
        const { getter, setter } = getRef(self, lValue);
        const val = doEval(self, rValue);
        return setter(getter() - val);
    },
    '<<='(self, lValue, rValue) {
        const { getter, setter } = getRef(self, lValue);
        const val = doEval(self, rValue);
        return setter(getter() << val);
    },
    '>>='(self, lValue, rValue) {
        const { getter, setter } = getRef(self, lValue);
        const val = doEval(self, rValue);
        return setter(getter() >> val);
    },
    '>>>='(self, lValue, rValue) {
        const { getter, setter } = getRef(self, lValue);
        const val = doEval(self, rValue);
        return setter(getter() >>> val);
    },
    '&='(self, lValue, rValue) {
        const { getter, setter } = getRef(self, lValue);
        const val = doEval(self, rValue);
        return setter(getter() & val);
    },
    '^='(self, lValue, rValue) {
        const { getter, setter } = getRef(self, lValue);
        const val = doEval(self, rValue);
        return setter(getter() ^ val);
    },
    '|='(self, lValue, rValue) {
        const { getter, setter } = getRef(self, lValue);
        const val = doEval(self, rValue);
        return setter(getter() | val);
    },
    '**='(self, lValue, rValue) {
        const { getter, setter } = getRef(self, lValue);
        const val = doEval(self, rValue);
        return setter(getter() ** val);
    },
    arrow(self, params, body) {
        return self.evaluators.lambda(self, params, body);
    },
    bind(self, patt, expr) {
        const val = doEval(self, expr);
        return [patt, val];
    },
    block(self, statements) {
        // Produce the final value.
        return statements.reduce((_, s) => doEval(self, s), undefined);
    },
    break(self, label) {
        if (label !== undefined) {
            err(self) `Nonempty break label ${{ label }} not implemented`;
        }
        throw [MAGIC_EXIT, 'break', label];
    },
    catch(_self, pattern, body) {
        return { bindings: [pattern], body };
    },
    const(self, binds) {
        binds.forEach(b => {
            const [pattern, val] = doEval(self, b);
            bindPattern(self, pattern, false, val);
        });
    },
    continue(self, label) {
        if (label !== undefined) {
            err(self) `Nonempty continue label ${{ label }} not implemented`;
        }
        throw [MAGIC_EXIT, 'continue', label];
    },
    finally(_self, body) {
        return { body };
    },
    for(self, decl, cond, incr, body) {
        const oldEnv = self.env();
        try {
            doEval(self, decl);
            while (doEval(self, cond)) {
                try {
                    doEval(self, body);
                }
                catch (e) {
                    if (e[0] === MAGIC_EXIT) {
                        switch (e[1]) {
                            case 'continue':
                                // Evaluate the incrementer, then continue the loop.
                                doEval(self, incr);
                                continue;
                            case 'break':
                                // Exit the loop.
                                return;
                        }
                    }
                    throw e;
                }
                doEval(self, incr);
            }
        }
        finally {
            self.env(oldEnv);
        }
    },
    forOf(self, declOp, binding, expr, body) {
        const mutable = declOp !== 'const';
        const it = doEval(self, expr);
        const oldEnv = self.env();
        for (const val of it) {
            try {
                bindPattern(self, binding, mutable, val);
                try {
                    doEval(self, body);
                }
                catch (e) {
                    if (e[0] === MAGIC_EXIT) {
                        switch (e[1]) {
                            case 'continue':
                                // Continue the loop.
                                continue;
                            case 'break':
                                // Exit the loop.
                                return;
                        }
                    }
                    throw e;
                }
            }
            finally {
                self.env(oldEnv);
            }
        }
    },
    functionDecl(self, def, params, body) {
        const lambda = self.evaluators.lambda(self, params, body);
        const name = doEval(self, def);
        addBinding(self, name, true, lambda);
    },
    functionExpr(self, def, params, body) {
        const lambda = self.evaluators.lambda(self, params, body);
        if (def) {
            const name = doEval(self, def);
            addBinding(self, name, true, lambda);
        }
        return lambda;
    },
    get(self, pe, index) {
        const obj = doEval(self, pe);
        return {
            getter: () => obj[index],
            setter: (val) => self.setComputedIndex(obj, index, val),
            thisObj: obj
        };
    },
    index(self, pe, e) {
        const obj = doEval(self, pe);
        const index = doEval(self, e);
        return {
            getter: () => obj[index],
            setter: (val) => self.setComputedIndex(obj, index, val),
            thisObj: obj,
        };
    },
    if(self, c, t, e) {
        const cval = doEval(self, c);
        if (cval) {
            doEval(self, t);
        }
        else if (e) {
            doEval(self, e);
        }
    },
    import(self, def, path) {
        const name = doEval(self, def);
        if (path[0] === '.' && path[1] === '/') {
            // Take the input relative to our current directory.
            path = `${self.dir}${path.slice(1)}`;
        }
        // Interpret with the same endowments.
        const val = self.import(path);
        addBinding(self, name, false, val);
    },
    lambda(self, bindings, body) {
        const parentEnv = self.env();
        const lambda = (...args) => {
            const oldEnv = self.env();
            try {
                self.env(parentEnv);
                return doApply(self, args, bindings, body);
            }
            finally {
                self.env(oldEnv);
            }
        };
        return lambda;
    },
    let(self, binds) {
        binds.forEach(b => {
            const [pattern, val] = doEval(self, b);
            bindPattern(self, pattern, true, val);
        });
    },
    module(self, body) {
        const oldEnv = self.env();
        try {
            let didExport = false, exported;
            for (const stmt of body) {
                if (stmt[0] === 'exportDefault') {
                    // Handle this production explicitly.
                    if (didExport) {
                        err(self) `Cannot use more than one "export default" statement`;
                    }
                    exported = doEval(self, stmt[1]);
                    didExport = true;
                }
                else {
                    doEval(self, stmt);
                }
            }
            return exported;
        }
        finally {
            self.env(oldEnv);
        }
    },
    ref(self, name) {
        let b = self.env();
        while (b !== undefined) {
            if (b[BINDING_NAME] === name) {
                return { getter: b[BINDING_GET], setter: b[BINDING_SET], thisObj: undefined };
            }
            b = b[BINDING_PARENT];
        }
        err(self) `ReferenceError: ${{ name }} is not defined`;
    },
    return(self, expr) {
        const val = doEval(self, expr);
        throw [MAGIC_EXIT, 'return', val];
    },
    throw(self, expr) {
        const val = doEval(self, expr);
        throw val;
    },
    try(self, b, c, f) {
        try {
            doEval(self, b);
        }
        catch (e) {
            if (e[0] === MAGIC_EXIT) {
                // Bypass the catchable exceptions.
                throw e;
            }
            if (c) {
                // Evaluate the `catch` block.
                const { bindings, body } = doEval(self, c);
                doApply(self, [e], bindings, body);
            }
        }
        finally {
            if (f) {
                // Evaluate the `finally` block.
                const { body } = doEval(self, f);
                doEval(self, body);
            }
        }
    },
    while(self, cond, body) {
        while (doEval(self, cond)) {
            try {
                doEval(self, body);
            }
            catch (e) {
                if (e[0] === MAGIC_EXIT) {
                    switch (e[1]) {
                        case 'continue':
                            // Continue the loop.
                            continue;
                        case 'break':
                            // Exit the loop.
                            return;
                    }
                }
                throw e;
            }
        }
    },
});
export default immunize(jessieEvaluators);
