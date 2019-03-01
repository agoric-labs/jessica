// TODO: Implement Jessie interpreter.
// FIXME: Need to start from scratch... no imperative code in Jessie!
const APPLY_PRIM = 0;
const APPLY_MACRO = 1;
const APPLY_DEFUN = 2;

type EvalEnv = any;
interface IEvalOptions {
    [key: string]: any;
    scriptName?: string;
}

function ChildEnvironment(parent: any, context: undefined | Map<string, any>): EvalEnv {
    return [parent, // Parent environment
        makeMap(), // Lexical defines
        context || makeMap(), // Compiler only
    ];
}

function oset(obj: Map<string, any>, key: string, val: any) {
    if (key === '__proto__') {
        throw makeError('__proto__ is not allowed as an object key');
    }
    obj.set(key, val);
}

const moduleContext = makeMap([
    ['exportDefault', (exp: any, env: EvalEnv) => {
        env[2].set('#exportDefault', exp[1]);
    }],
    [';', (exp: any, env: EvalEnv) => undefined],
]);

const exprContext = makeMap([
    ['data', (data: any, env: EvalEnv) => data[1]],
]);

const topLevelContext = makeMap([
    ['module', (script: any, env: EvalEnv) => {
        // We need to look for the export default.
        const mod = ChildEnvironment(env, moduleContext);
        script[1].forEach((expr: any) => evalJessie(expr, mod));

        const exp = mod[2].get('#exportDefault');
        if (exp) {
            // Return the exported value.
            return evalJessie(exp, ChildEnvironment(mod, exprContext));
        }

        // The module didn't export.
        throw makeError(`Module ${JSON.stringify(script[2])} did not export default`);
    }],
]);

function evalJessie(src: string, env: EvalEnv) {
    // Look up the ident in the meta map.
    const evaluator = env[2].get(src[0]);
    if (!evaluator) {
        throw makeError(`Unbound evaluator ${JSON.stringify(src[0])}`);
    }

    return evaluator(src, env);
}

function interpJessie(ast: any, endowments: {[key: string]: any}, options: IEvalOptions = {}) {
    const [tag, body] = ast;
    if (tag === 'module') {
        ast = [tag, body, options.scriptName];
    }
    return evalJessie(ast, ChildEnvironment(endowments, topLevelContext));
}
interpJessie.expr = (ast: any, endowments: {[key: string]: any}, options: IEvalOptions = {}) => {
    const [tag, body] = ast;
    if (tag === 'module') {
        ast = [tag, body, options.scriptName];
    }
    return evalJessie(ast, ChildEnvironment(endowments, exprContext));
};

export default harden(interpJessie);
