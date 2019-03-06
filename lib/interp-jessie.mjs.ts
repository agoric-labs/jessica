// TODO: Implement Jessie interpreter.
import makeStructuredClone from './struct-clone.mjs';

interface IEvalOptions {
    [key: string]: any;
    scriptName?: string;
}

declare type ComputedGet = (obj: any, index: string | number) => any;

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
    actions: Map<string, Evaluator>;
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
    const ee = ctx.actions.get(name);
    if (!ee) {
        throw makeError(`No ${JSON.stringify(name)} implemented in ${ctx.name} context`);
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
        throw makeError(`Expected a function, not ${lambda}`);
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
    throw makeError(`Cannot find binding for ${name} in current scope`);
}

function evalBlock(ctx: IEvalContext, statements: any[][]) {
    // Produce the final value.
    return statements.reduce<any>((_, s) => doEval(ctx, ...s), undefined);
}

type Def = ['def', string];

function makeInterpJessie(computedGet: ComputedGet) {
    function evalGet(ctx: IEvalContext, objExpr: any[], index: any) {
        const obj = doEval(ctx, ...objExpr);
        return computedGet(obj, index); // FIXME: No computed get in Jessie!
    }

    const structuredClone = makeStructuredClone(Object.entries);
    function evalData(ctx: IEvalContext, struct: any) {
        return structuredClone(struct);
    }

    const moduleActions = makeMap<string, Evaluator>([
        ['module', evalModule],
    ]);

    const moduleBodyActions = makeMap<string, Evaluator>([
        ['functionDecl', evalFunctionDecl],
    ]);

    const exprActions = makeMap<string, Evaluator>([
        ['call', evalCall],
        ['data', evalData],
        ['get', evalGet],
        ['use', evalUse],
    ]);

    const statementActions = makeMap<string, Evaluator>([
        ...exprActions.entries(),
        ['functionDecl', evalFunctionDecl],
        ['block', evalBlock],
    ]);

    function evalModule(ctx: IEvalContext, body: any[]) {
        const bodyCtx = {...ctx, actions: moduleBodyActions, name: 'module body'};
        let didExport = false, exported: any;
        for (const [bodyName, ...bodyArgs] of body) {
            if (bodyName === 'exportDefault') {
                if (didExport) {
                    throw makeError(`Cannot use more than one "export default" statement`);
                }
                const exprCtx = {...bodyCtx, actions: exprActions, name: 'expression'};
                exported = doEval(exprCtx, ...bodyArgs[0]);
                didExport = true;
            } else {
                doEval(bodyCtx, bodyName, ...bodyArgs);
            }
        }
        return exported;
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
