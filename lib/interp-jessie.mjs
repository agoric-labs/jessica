// TODO: Implement Jessie interpreter.
import makeStructuredClone from './struct-clone.mjs';
var Binding;
(function (Binding) {
    Binding[Binding["parent"] = 0] = "parent";
    Binding[Binding["name"] = 1] = "name";
    Binding[Binding["getter"] = 2] = "getter";
    Binding[Binding["setter"] = 3] = "setter";
})(Binding || (Binding = {}));
function makeHardenedBinding(ctx, name, init) {
    const immutableSlot = harden(init);
    return harden([ctx.envp, name, () => immutableSlot]);
}
function makeMutableBinding(ctx, name, init) {
    let slot = init;
    return harden([ctx.envp, name,
        () => slot, (val) => slot = val,
    ]);
}
function doEval(ctx, ...nameArgs) {
    // slog.info`eval ${nameArgs}`;
    const [name, ...args] = nameArgs;
    const ee = ctx.actions[name];
    if (!ee) {
        throw makeError(`No ${JSON.stringify(name)} implemented in ${ctx.name} context`);
    }
    return ee(ctx, ...args);
}
function doApply(ctx, args, formals, body) {
    // Bind the formals.
    // TODO: Rest arguments.
    formals.forEach((f, i) => ctx.envp = makeMutableBinding(ctx, f, args[i]));
    // Evaluate the body.
    return doEval(ctx, ...body);
}
function evalCall(ctx, func, args) {
    const lambda = doEval(ctx, ...func);
    if (typeof lambda !== 'function') {
        throw makeError(`Expected a function, not ${lambda}`);
    }
    const evaledArgs = args.map((a) => doEval(ctx, ...a));
    return lambda(...evaledArgs);
}
function evalUse(ctx, name) {
    let b = ctx.envp;
    while (b !== undefined) {
        if (b[Binding.name] === name) {
            return b[Binding.getter]();
        }
        b = b[Binding.parent];
    }
    throw makeError(`Cannot find binding for ${name} in current scope`);
}
function evalBlock(ctx, statements) {
    // Produce the final value.
    return statements.reduce((_, s) => doEval(ctx, ...s), undefined);
}
function evalGet(ctx, objExpr, index) {
    const obj = doEval(ctx, ...objExpr);
    return obj[index];
}
function makeInterpJessie() {
    const structuredClone = makeStructuredClone(Object.entries);
    function evalData(ctx, struct) {
        return structuredClone(struct);
    }
    const moduleActions = {
        module: evalModule,
    };
    const moduleBodyActions = {
        exportDefault: evalExportDefault,
        functionDecl: evalFunctionDecl,
    };
    const exprActions = {
        call: evalCall,
        data: evalData,
        get: evalGet,
        use: evalUse,
    };
    const statementActions = {
        ...exprActions,
        block: evalBlock,
        functionDecl: evalFunctionDecl,
    };
    function evalExportDefault(ctx, expr) {
        const exprCtx = { ...ctx, actions: exprActions, name: 'expression' };
        return doEval(exprCtx, ...expr);
    }
    function evalModule(ctx, body) {
        const bodyCtx = { ...ctx, actions: moduleBodyActions, name: 'module body' };
        let didExport = false, exported;
        for (const stmt of body) {
            if (stmt[0] === 'exportDefault') {
                if (didExport) {
                    throw makeError(`Cannot use more than one "export default" statement`);
                }
                exported = doEval(bodyCtx, ...stmt);
                didExport = true;
            }
            else {
                doEval(bodyCtx, ...stmt);
            }
        }
        return exported;
    }
    function evalFunctionDecl(ctx, nameDef, argDefs, body) {
        const [_ndef, name] = nameDef;
        const formals = argDefs.map(([_adef, arg]) => arg);
        const lambda = (...args) => {
            // Capture the evalContext here.
            const statementCtx = { ...ctx, actions: statementActions, name: 'statement' };
            return doApply(statementCtx, args, formals, body);
        };
        ctx.envp = makeMutableBinding(ctx, name, harden(lambda));
    }
    // TODO: Hoist all shallow nested function definitions to the block's toplevel.
    function interpJessie(ast, endowments, options) {
        // slog.info`AST: ${JSON.stringify(ast, undefined, 2)}`;
        const ctx = { actions: moduleActions, name: 'module' };
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
