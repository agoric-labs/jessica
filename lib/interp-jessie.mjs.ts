// TODO: Implement Jessie interpreter.
import makeStructuredClone from './struct-clone.mjs';

interface IEvalOptions {
    [key: string]: any;
    scriptName?: string;
}

type Evaluator = (context: IEvalContext, ...args: any[]) => any;
enum Binding {
    parent = 0,
    name = 1,
    getter = 2,
    setter = 3,
}
interface IBinding {
    [Binding.parent]: IBinding | undefined;
    [Binding.name]: string;
    [Binding.getter]: () => any;
    [Binding.setter]?: (val: any) => typeof val;
}

interface IEvalContext {
    actions: Record<string, Evaluator>;
    name: string;
    envp?: Hardened<IBinding>;
}

interface ILambda {
    body: any[][];
    formals: string[];
}

function makeHardenedBinding(ctx: IEvalContext, name: string, init?: any) {
    const immutableSlot = harden(init);
    return harden<IBinding>([ctx.envp, name, () => immutableSlot]);
}

function makeMutableBinding(ctx: IEvalContext, name: string, init?: any) {
    let slot = init;
    return harden<IBinding>([ctx.envp, name,
        () => slot, (val: any) => slot = val,
    ]);
}

function doEval(ctx: IEvalContext, ...nameArgs: any[]) {
    // slog.info`eval ${nameArgs}`;
    const [name, ...args] = nameArgs;
    const ee = ctx.actions[name];
    if (!ee) {
        slog.error`No ${{name}} implemented in ${ctx.name} context`;
    }
    return ee(ctx, ...args);
}

function doApply(ctx: IEvalContext, args: any[], formals: string[], body: any[]) {
    // Bind the formals.
    // TODO: Rest arguments.
    formals.forEach((f, i) => ctx.envp = makeMutableBinding(ctx, f, args[i]));

    // Evaluate the body.
    return doEval(ctx, ...body);
}

function evalCall(ctx: IEvalContext, func: any[], args: any[][]) {
    const lambda = doEval(ctx, ...func);
    if (typeof lambda !== 'function') {
        slog.error`Expected a function, not ${{lambda}}`;
    }
    const evaledArgs = args.map((a) => doEval(ctx, ...a));
    return lambda(...evaledArgs);
}

function evalUse(ctx: IEvalContext, name: string) {
    let b = ctx.envp;
    while (b !== undefined) {
        if (b[Binding.name] === name) {
            return b[Binding.getter]();
        }
        b = b[Binding.parent];
    }
    slog.error`Cannot find binding for ${name} in current scope`;
}

function evalBlock(ctx: IEvalContext, statements: any[][]) {
    // Produce the final value.
    return statements.reduce<any>((_, s) => doEval(ctx, ...s), undefined);
}

function evalGet(ctx: IEvalContext, objExpr: any[], index: any) {
    const obj = doEval(ctx, ...objExpr);
    return obj[index];
}

type Def = ['def', string];

function makeInterpJessie(importer: (path: string, evaluator: (ast: any[]) => any) => any) {
    const structuredClone = makeStructuredClone();
    function evalData(ctx: IEvalContext, struct: any) {
        return structuredClone(struct);
    }

    const exprActions: Record<string, Evaluator> = {
        call: evalCall,
        data: evalData,
        get: evalGet,
        use: evalUse,
    };

    const statementActions: Record<string, Evaluator> = {
        ...exprActions,
        block: evalBlock,
        functionDecl: evalFunctionDecl,
    };

    function evalExportDefault(ctx: IEvalContext, expr: any[]) {
        const exprCtx = {...ctx, actions: exprActions, name: 'expression'};
        return doEval(exprCtx, ...expr);
    }

    function evalFunctionDecl(ctx: IEvalContext, nameDef: Def, argDefs: Def[], body: any[]) {
        const [_ndef, name] = nameDef;
        const formals = argDefs.map(([_adef, arg]) => arg);
        const lambda = (...args: any[]) => {
            // Capture the evalContext here.
            const statementCtx = {...ctx, actions: statementActions, name: 'statement'};
            return doApply(statementCtx, args, formals, body);
        };
        ctx.envp = makeMutableBinding(ctx, name, harden(lambda));
    }

    // TODO: Hoist all shallow nested function definitions to the block's toplevel.

    function interpJessie(ast: any[], endowments: Record<string, any>, options?: IEvalOptions): any {
        const lastSlash = options.scriptName === undefined ? -1 : options.scriptName.lastIndexOf('/');
        const thisDir = lastSlash < 0 ? '.' : options.scriptName.slice(0, lastSlash);

        const moduleBodyActions: Record<string, Evaluator> = {
            exportDefault: evalExportDefault,
            functionDecl: evalFunctionDecl,
            import: evalImport,
        };

        const moduleActions: Record<string, Evaluator> = {
            module: evalModule,
        };

        function evalModule(ectx: IEvalContext, body: any[]) {
            const bodyCtx = {...ectx, actions: moduleBodyActions, name: 'module body'};
            let didExport = false, exported: any;
            for (const stmt of body) {
                if (stmt[0] === 'exportDefault') {
                    if (didExport) {
                        slog.error`Cannot use more than one "export default" statement`;
                    }
                    exported = doEval(bodyCtx, ...stmt);
                    didExport = true;
                } else {
                    doEval(bodyCtx, ...stmt);
                }
            }
            return exported;
        }

        function evalImport(ectx: IEvalContext, varBinding: any[], path: string) {
            if (varBinding[0] !== 'def') {
                slog.error`Unrecognized import variable binding ${{varBinding}}`;
            }
            if (path[0] === '.') {
                // Take the input relative to our current path.
                path = `${thisDir}${path.slice(1)}`;
            }

            // Interpret with no additional endowments.
            const evaluator = (east: any[]) => interpJessie(east, endowments, {scriptName: path});
            const val = importer(path, evaluator);
            ectx.envp = makeHardenedBinding(ectx, varBinding[1], val);
            return val;
        }

        // slog.info`AST: ${JSON.stringify(ast, undefined, 2)}`;
        const ctx: IEvalContext = {actions: moduleActions, name: 'module'};
        for (const [name, value] of Object.entries(endowments)) {
            // slog.info`Adding ${name}, ${value} to bindings`;
            ctx.envp = makeHardenedBinding(ctx, name, value);
        }
        return doEval(ctx, ...ast);
    }

    interpJessie.expr = interpJessie;
    return harden(interpJessie);
}

export default harden(makeInterpJessie);
