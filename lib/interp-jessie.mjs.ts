// TODO: Implement Jessie interpreter.

interface IEvalOptions {
    [key: string]: any;
    scriptName?: string;
}

function makeInterpJessie() {
    function interpJessie(ast: any, endowments: Record<string, any>, options?: IEvalOptions): any {
        slog.info`AST: ${JSON.stringify(ast, undefined, 2)}`;
        throw makeError('FIXME: Not implemented');
    }
    interpJessie.expr = interpJessie;
    return harden(interpJessie);
}

export default harden(makeInterpJessie);
