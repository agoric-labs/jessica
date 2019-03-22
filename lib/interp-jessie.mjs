// DO NOT EDIT - Generated automatically from interp-jessie.mjs.ts by tessc
// TODO: Hoisting of functionDecls.
import justinEvaluators from './interp-justin.mjs';
import { doApply, doEval, makeBinding } from './interp-utils.mjs';
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
export default immunize(jessieEvaluators);
