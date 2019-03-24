export interface IEvalOptions {
    [key: string]: any;
    scriptName?: string;
}

export type Evaluator = (self: IEvalContext, ...args: any[]) => any;
export type Evaluators = Record<string, Evaluator>;

export const BINDING_PARENT = 0;
export const BINDING_NAME = 1;
export const BINDING_GET = 2;
export const BINDING_SET = 3;

export interface IBinding {
    [BINDING_PARENT]: IBinding | undefined;
    [BINDING_NAME]: string;
    [BINDING_GET]: () => any;
    [BINDING_SET]?: (val: any) => typeof val;
}

export interface IEvalContext {
    applyMethod: (obj: any, lambda: (...args: any[]) => any, args: any[]) => any;
    setComputedIndex: (obj: Record<string | number, any>, key: string | number, val: any) => void;
    dir: string;
    env: (binding?: IBinding) => IBinding;
    evaluators: Evaluators;
    import: (path: string) => any;
    pos: (pos?: string) => string;
    uri: string;
}

const UNINITIALIZED = {toString() { return 'UNINITIALIZED'; }};
export const addBinding = (
    self: IEvalContext, name: string,
    mutable: boolean, init: any = UNINITIALIZED): IBinding => {
    let slot: any, setter: (<T>(val: T) => T);
    if (mutable) {
        setter = <T>(val: T) => slot = val;
    }
    if (init === UNINITIALIZED) {
        if (!mutable) {
            let allow = true;
            setter = <T>(val: T) => {
                if (!allow) {
                    slog.error`${name} already initialized`;
                }
                allow = false;
                return slot = val;
            };
        }
    } else {
        slot = init;
    }
    const b: IBinding = [self.env(), name, () => slot, setter];
    return self.env(b);
};

export const err = (self: IEvalContext) => {
    slog.info`${self.uri} at ${self.pos()}`;
    return slog.error;
};

export const doEval = (self: IEvalContext, ast: any[], overrideName?: string) => {
    const [astName, ...args] = ast;
    const name = overrideName || astName;
    const ev = self.evaluators[name];
    const pos = (ast as any)._pegPosition;
    const oldPos = self.pos(pos);
    try {
        if (!ev) {
            slog.error`No ${{name}} implementation`;
        }
        return ev(self, ...args);
    } finally {
        self.pos(oldPos);
    }
};

const makeInterp = (
    evaluators: Evaluators,
    applyMethod: (boundThis: any, method: (...args: any[]) => any, args: any[]) => any,
    importer: (path: string, evaluator: (ast: any[]) => any) => any,
    setComputedIndex: (obj: Record<string | number, any>, index: string | number, value: any) => void) => {
    function interp(ast: any[], endowments: Record<string, any>, options?: IEvalOptions): any {
        const lastSlash = options.scriptName === undefined ? -1 : options.scriptName.lastIndexOf('/');
        const thisDir = lastSlash < 0 ? '.' : options.scriptName.slice(0, lastSlash);
        let envp: IBinding, pos = '';

        const self: IEvalContext = {
            applyMethod,
            dir: thisDir,
            evaluators,
            import(path) {
                return importer(path, (iast: any[]) => interp(iast, endowments, {scriptName: path}));
            },
            setComputedIndex,
            env(newEnv?: IBinding) {
                if (newEnv) {
                    envp = newEnv;
                }
                return envp;
            },
            pos(newPos?: string) {
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
};

export default makeInterp;
