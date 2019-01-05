// TODO: Implement Jessie interpreter.
const APPLY_PRIM = 0;
const APPLY_MACRO = 1;
const APPLY_DEFUN = 2;

function ChildEnvironment(parent, context) {
    return [parent, // Parent environment
        makeMap(), // Lexical defines
        context || makeMap(), // Compiler only
    ];
}

function SecError(...args) {
    return ['Jessie Confinement Error', ...args];
}

function oset(obj, key, val) {
    if (key === '__proto__') {
        throw SecError('__proto__ is not allowed as an object key');
    }
    obj.set(key, val);
}

const moduleContext = makeMap([
    ['exportDefault', (exp, env) => {
        env[2].set('#exportDefault', exp[1]);
    }],
    [';', (exp, env) => undefined],
]);

const exprContext = makeMap([
    ['data', (data, env) => data[1]],
]);

const topLevelContext = makeMap([
    ['module', (script, env) => {
        // We need to look for the export default.
        const mod = ChildEnvironment(env, moduleContext);
        script[1].forEach((expr) => evalJessie(expr, mod));
        
        const exp = mod[2].get('#exportDefault');
        if (exp) {
            // Return the exported value.
            return evalJessie(exp, ChildEnvironment(mod, exprContext));
        }
        
        // The module didn't export.
        throw SecError(`Module ${JSON.stringify(script[2])} did not export default`);
    }],
]);

function evalJessie(src, env) {
    // Look up the ident in the meta map.
    const evaluator = env[2].get(src[0]);
    if (!evaluator) {
        throw SecError(`Unbound evaluator ${JSON.stringify(src[0])}`);
    }

    return evaluator(src, env);
}

function interpJessie(ast, endowments, options) {
    const [tag, body] = ast;
    if (tag === 'module') {
        ast = [tag, body, (options || {}).scriptName];
    }
    return evalJessie(ast, ChildEnvironment(endowments, topLevelContext));
}
interpJessie.expr = function interpJessieExpr(ast, endowments, options) {
    const [tag, body] = ast;
    if (tag === 'module') {
        ast = [tag, body, (options || {}).scriptName];
    }
    return evalJessie(ast, ChildEnvironment(endowments, exprContext));
};

export default harden(interpJessie);
