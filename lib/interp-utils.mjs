// DO NOT EDIT - Generated automatically from interp-utils.mjs.ts by tessc
export const BINDING_PARENT = 0;
export const BINDING_NAME = 1;
export const BINDING_GET = 2;
export const BINDING_SET = 3;
export const addBinding = immunize((self, name, init, mutable = true) => {
    let slot = init;
    const setter = mutable && ((val) => slot = val);
    const b = [self.env(), name, () => slot, setter];
    return self.env(b);
});
export const doEval = immunize((self, ...astArgs) => {
    const [name, ...args] = astArgs;
    const ev = self.evaluators[name];
    if (!ev) {
        slog.error `No ${{ name }} implementation`;
    }
    return ev(self, ...args);
});
const makeInterp = immunize((evaluators, applyMethod, importer, setComputedIndex) => {
    function interp(ast, endowments, options) {
        const lastSlash = options.scriptName === undefined ? -1 : options.scriptName.lastIndexOf('/');
        const thisDir = lastSlash < 0 ? '.' : options.scriptName.slice(0, lastSlash);
        let envp;
        const self = {
            applyMethod,
            dir: thisDir,
            evaluators,
            import(path) {
                return importer(path, (iast) => interp(iast, endowments, { scriptName: path }));
            },
            setComputedIndex,
            env(newEnv) {
                if (newEnv) {
                    envp = newEnv;
                }
                return envp;
            },
        };
        // slog.info`AST: ${{ast}}`;
        for (const [name, value] of Object.entries(endowments)) {
            // slog.info`Adding ${name}, ${value} to bindings`;
            addBinding(self, name, value);
        }
        return doEval(self, ...ast);
    }
    return interp;
});
export default immunize(makeInterp);
