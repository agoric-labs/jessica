import bootPeg from './boot-peg.mjs';
import bootPegAst from './boot-pegast.mjs';
import makeJessie from './quasi-jessie.mjs';
import makeJSON from './quasi-json.mjs';
import makeJustin from './quasi-justin.mjs';
import makePeg from './quasi-peg.mjs';
import makeImporter from './importer.mjs';
import makeInterpJessie from './interp-jessie.mjs';
import tagString from './tag-string.mjs';
function bootEnv(endowments, readInput) {
    // Bootstrap a peg tag.
    const pegTag = bootPeg(makePeg, bootPegAst);
    // Stack up the parser.
    const jsonTag = makeJSON(pegTag);
    const justinTag = makeJustin(pegTag.extends(jsonTag));
    const jessieTag = makeJessie(pegTag.extends(justinTag));
    const importer = makeImporter(readInput, jessieTag);
    const interpJessie = makeInterpJessie(importer);
    const env = harden({
        ...endowments,
        confine: (src, evalenv, options) => {
            const ast = tagString(jessieTag, options.scriptName) `${src + '\n;'}`;
            return harden(interpJessie(ast, evalenv, options || {}));
        },
        confineExpr: (src, evalenv, options) => {
            // FIXME: Use the `expr` starting point for jessieTag.
            const ast = tagString(jessieTag.expr, options.scriptName) `${'(' + src + '\n)'}`;
            return harden(interpJessie(ast, evalenv, options || {}));
        },
        eval: (src) => {
            const ast = tagString(jessieTag) `${src}`;
            return interpJessie(ast, env);
        },
    });
    return env;
}
export default harden(bootEnv);
