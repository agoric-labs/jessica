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
    setComputedIndex: <T>(obj: Record<string | number, any>, key: string | number, val: T) => T;
    dir: string;
    env: (binding?: IBinding) => IBinding;
    evaluators: Evaluators;
    import: (path: string) => any;
    setLabel: (label: string | undefined) => string | undefined;
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
                    err(self)`${{name}} already initialized`;
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

export const doEval = <T = any>(self: IEvalContext, ast: any[], overrideName?: string, label?: string): T => {
    const [astName, ...args] = ast;
    const name = overrideName || astName;
    const ev = self.evaluators[name];
    const pos = (ast as any)._pegPosition;
    const oldPos = self.pos(pos);
    // Always reset the label to either undefined or the one the caller passed.
    self.setLabel(label);
    try {
        if (!ev) {
            err(self)`No ${{name}} implementation`;
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
    setComputedIndex: <T>(obj: Record<string | number, any>, index: string | number, value: T) => T) => {
    function interp(ast: any[], endowments: Record<string, any>, options?: IEvalOptions): any {
        const lastSlash = options.scriptName === undefined ? -1 : options.scriptName.lastIndexOf('/');
        const thisDir = lastSlash < 0 ? '.' : options.scriptName.slice(0, lastSlash);
        let envp: IBinding, pos = '', label: string;

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
            setLabel(newLabel: string | undefined) {
                // This always removes the old label.
                const oldLabel = label;
                label = newLabel;
                return oldLabel;
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

interface IRef {
    getter: () => any;
    setter: <T>(val: T) => T;
    thisObj?: any;
}

export const getRef = (self: IEvalContext, astNode: any[], mutable = true): IRef => {
    const oldPos = self.pos();
    try {
        const pos = (astNode as any)._pegPosition;
        self.pos(pos);
        switch (astNode[0]) {
        case 'use': {
            let b = self.env();
            const [, name] = astNode;
            while (b !== undefined) {
                if (b[BINDING_NAME] === name) {
                    return {getter: b[BINDING_GET], setter: b[BINDING_SET]};
                }
                b = b[BINDING_PARENT];
            }
            err(self)`ReferenceError: ${{name}} is not defined`;
        }

        case 'get': {
            const [, objExpr, id] = astNode;
            const obj = doEval(self, objExpr);
            return {
                getter: () => obj[id],
                setter: <T>(val: T): T => self.setComputedIndex(obj, id, val),
                thisObj: obj,
            };
        }

        case 'def': {
            const [, name] = astNode;
            const b = addBinding(self, name, mutable);
            return {getter: b[BINDING_GET], setter: b[BINDING_SET]};
        }

        default: {
            err(self)`Reference type ${{type: astNode[0]}} not implemented`;
        }
        }
    } finally {
        self.pos(oldPos);
    }
};

export default makeInterp;
