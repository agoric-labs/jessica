// DO NOT EDIT - Generated automatically from interp-utils.mjs.ts by tessc
export const BINDING_PARENT = 0;
export const BINDING_NAME = 1;
export const BINDING_GET = 2;
export const BINDING_SET = 3;
const UNINITIALIZED = immunize({ toString() { return 'UNINITIALIZED'; } });
export const addBinding = immunize((self, name, mutable, init = UNINITIALIZED) => {
    let slot, setter;
    if (mutable) {
        setter = (val) => slot = val;
    }
    if (init === UNINITIALIZED) {
        if (!mutable) {
            let allow = true;
            setter = (val) => {
                if (!allow) {
                    err(self) `${{ name }} already initialized`;
                }
                allow = false;
                return slot = val;
            };
        }
    }
    else {
        slot = init;
    }
    const b = [self.env(), name, () => slot, setter];
    return self.env(b);
});
export const err = immunize((self) => {
    slog.info `${self.uri} at ${self.pos()}`;
    return slog.error;
});
export const doEval = immunize((self, ast, overrideName) => {
    const [astName, ...args] = ast;
    const name = overrideName || astName;
    const ev = self.evaluators[name];
    const pos = ast._pegPosition;
    const oldPos = self.pos(pos);
    try {
        if (!ev) {
            err(self) `No ${{ name }} implementation`;
        }
        return ev(self, ...args);
    }
    finally {
        self.pos(oldPos);
    }
});
const makeInterp = immunize((evaluators, applyMethod, importer, setComputedIndex) => {
    function interp(ast, endowments, options) {
        const lastSlash = options.scriptName === undefined ? -1 : options.scriptName.lastIndexOf('/');
        const thisDir = lastSlash < 0 ? '.' : options.scriptName.slice(0, lastSlash);
        let envp, pos = '';
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
            pos(newPos) {
                const oldPos = pos;
                if (newPos) {
                    pos = newPos;
                }
                return oldPos;
            },
            uri: options.scriptName,
        };
        // slog.info`AST: ${{ast}}`;
        for (const [name, value] of Object.entries(endowments)) {
            // slog.info`Adding ${name}, ${value} to bindings`;
            addBinding(self, name, false, value);
        }
        return doEval(self, ast);
    }
    return interp;
});
export default immunize(makeInterp);
