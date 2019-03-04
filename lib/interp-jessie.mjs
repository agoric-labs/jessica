// TODO: Implement Jessie interpreter.
function makeInterpJessie() {
    function interpJessie(ast, endowments, options) {
        slog.info `AST: ${JSON.stringify(ast, undefined, 2)}`;
        throw makeError('FIXME: Not implemented');
    }
    interpJessie.expr = interpJessie;
    return harden(interpJessie);
}
export default harden(makeInterpJessie);
