import bootPeg from './boot-peg.mjs';
import bootPegAst from './boot-pegast.mjs';
import makeJessie from './quasi-jessie.mjs';
import makeJSON from './quasi-json.mjs';
import makeJustin from './quasi-justin.mjs';
import makePeg from './quasi-peg.mjs';
import makeInterpJessie from './interp-jessie.mjs';
import tagString from './tag-string.mjs';
function bootEnv(computedGet, endowments) {
    // Bootstrap a peg tag.
    const pegTag = bootPeg(makePeg, bootPegAst);
    // Stack up the parser.
    const jsonTag = makeJSON(pegTag);
    const justinTag = makeJustin(pegTag, jsonTag);
    const jessieTag = makeJessie(pegTag, justinTag);
    const interpJessie = makeInterpJessie(computedGet);
    const env = harden({
        ...endowments,
        confine: (src, evalenv, options) => {
            const ast = tagString(jessieTag, options.scriptName) `${src + '\n;'}`;
            return harden(interpJessie(ast, evalenv, options || {}));
        },
        confineExpr: (src, evalenv, options) => {
            const ast = tagString(jessieTag, options.scriptName) `${'(' + src + '\n)'}`;
            return harden(interpJessie.expr(ast, evalenv, options || {}));
        },
        eval: (src) => {
            const ast = tagString(jessieTag) `${src}`;
            return interpJessie(ast, env);
        },
    });
    return env;
}
export default harden(bootEnv);
