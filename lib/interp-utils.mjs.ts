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
    setComputedIndex: (obj: Record<string | number, any>, key: string | number, val: any) => void;
    dir: string;
    envp?: Immune<IBinding>;
    evaluators: Evaluators;
    import: (path: string) => any;
}

export const makeBinding = (parent: IBinding, name: string, init?: any, mutable = true): IBinding => {
    let slot = init;
    const setter = mutable && ((val: any) => slot = val);
    return [parent, name, () => slot, setter];
};

export const doEval = (self: IEvalContext, ...astArgs: any[]) => {
    const [name, ...args] = astArgs;
    const ev = self.evaluators[name];
    if (!ev) {
        slog.error`No ${{name}} implementation`;
    }
    return ev(self, ...args);
};

export const doApply = (self: IEvalContext, args: any[], formals: string[], body: any[]) => {
    // Bind the formals.
    // TODO: Rest arguments.
    formals.forEach((f, i) => self.envp = makeBinding(self.envp, f, args[i]));

    // Evaluate the body.
    return doEval(self, ...body);
};

const makeInterp = (
    evaluators: Evaluators,
    importer: (path: string, evaluator: (ast: any[]) => any) => any,
    setComputedIndex: (obj: Record<string | number, any>, index: string | number, value: any) => void) => {
    function interp(ast: any[], endowments: Record<string, any>, options?: IEvalOptions): any {
        const lastSlash = options.scriptName === undefined ? -1 : options.scriptName.lastIndexOf('/');
        const thisDir = lastSlash < 0 ? '.' : options.scriptName.slice(0, lastSlash);

        const self: IEvalContext = {
            dir: thisDir,
            evaluators,
            import: (path) =>
                importer(path, (iast: any[]) => interp(iast, endowments, {scriptName: path})),
            setComputedIndex,
        };

        // slog.info`AST: ${{ast}}`;
        for (const [name, value] of Object.entries(endowments)) {
            // slog.info`Adding ${name}, ${value} to bindings`;
            self.envp = makeBinding(self.envp, name, value);
        }
        return doEval(self, ...ast);
    }

    return interp;
};

export default makeInterp;
