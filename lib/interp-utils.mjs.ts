import { makeMap } from '@agoric/jessie';
import { slog } from '@michaelfig/slog';

export interface IEvalOptions {
    [key: string]: any;
    scriptName?: string;
}

export type Evaluator = (self: IEvalContext, ...args: any[]) => any;
export type Evaluators = Record<string, Evaluator>;

export const BINDING_GET = 0;
export const BINDING_SET = 1;

export interface IBinding {
    [BINDING_GET]: () => any;
    [BINDING_SET]?: <T>(val: T) => T;
}

export const SCOPE_PARENT = 0;
export const SCOPE_GET = 1;
export const SCOPE_SET = 2;
export interface IScope {
    [SCOPE_PARENT]: IScope | undefined;
    [SCOPE_GET]: (name: string) => IBinding | undefined;
    [SCOPE_SET]: (name: string, binding: IBinding) => void;
}

export interface IEvalContext {
    applyMethod: (obj: any, lambda: (...args: any[]) => any, args: any[]) => any;
    setComputedIndex: <T>(obj: Record<string | number, any>, key: string | number, val: T) => T;
    binding: (name: string, binding?: IBinding) => IBinding;
    dir: string;
    evaluators: Evaluators;
    import: (path: string) => Record<string, any>;
    setLabel: (label: string | undefined) => string | undefined;
    scope: (scope?: IScope | true) => IScope;
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
                    throw err(self)`${{name}} already initialized`;
                }
                allow = false;
                return slot = val;
            };
        }
    } else {
        slot = init;
    }
    const b: IBinding = [() => slot, setter];
    return self.binding(name, b);
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
            throw err(self)`No ${{name}} implementation`;
        }
        return ev(self, ...args);
    } finally {
        self.pos(oldPos);
    }
};

const makeInterp = (
    evaluators: Evaluators,
    applyMethod: (boundThis: any, method: (...args: any[]) => any, args: any[]) => any,
    importer: (path: string, evaluator: (ast: any[]) => any) => Record<string, any>,
    setComputedIndex: <T>(obj: Record<string | number, any>, index: string | number, value: T) => T) => {
    function interp(ast: any[], endowments: Record<string, any>, options?: IEvalOptions): any {
        const lastSlash = options.scriptName === undefined ? -1 : options.scriptName.lastIndexOf('/');
        const thisDir = lastSlash < 0 ? '.' : options.scriptName.slice(0, lastSlash);
        let scope: IScope, pos = '', label: string;

        const self: IEvalContext = {
            applyMethod,
            dir: thisDir,
            evaluators,
            import(path) {
                const val = importer(path, (iast: any[]) => interp(iast, endowments, {scriptName: path}));
                slog.info(`imported ${path} as ${{val}}`);
                return val;
            },
            setComputedIndex,
            binding(name: string, newBinding?: IBinding) {
                if (newBinding) {
                    scope[SCOPE_SET](name, newBinding);
                } else {
                    newBinding = scope[SCOPE_GET](name);
                }
                return newBinding;
            },
            pos(newPos?: string) {
                const oldPos = pos;
                if (newPos) {
                    pos = newPos;
                }
                return oldPos;
            },
            scope(newScope?: IScope | true) {
                const oldScope = scope;
                if (newScope) {
                    if (newScope === true) {
                        const map = makeMap<string, IBinding>();
                        newScope = [
                            oldScope,
                            (name: string) =>
                                map.get(name) || (oldScope && oldScope[SCOPE_GET](name)),
                            (name: string, binding: IBinding) =>
                                map.has(name) ? err(self)`Cannot redefine ${{name}}` : map.set(name, binding),
                        ];
                    }
                    scope = newScope;
                }
                return oldScope;
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
        self.scope(true);
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
            const name = astNode[1];
            const b = self.binding(name);
            if (b) {
                return {getter: b[BINDING_GET], setter: b[BINDING_SET]};
            }
            throw err(self)`ReferenceError: ${{name}} is not defined`;
        }

        case 'get': {
            const [objExpr, id] = astNode.slice(1);
            const obj = doEval(self, objExpr);
            return {
                getter: () => obj[id],
                setter: <T>(val: T): T => self.setComputedIndex(obj, id, val),
                thisObj: obj,
            };
        }

        case 'def': {
            const name = astNode[1];
            const b = addBinding(self, name, mutable);
            return {getter: b[BINDING_GET], setter: b[BINDING_SET]};
        }

        default: {
            throw err(self)`Reference type ${{type: astNode[0]}} not implemented`;
        }
        }
    } finally {
        self.pos(oldPos);
    }
};

export default makeInterp;
