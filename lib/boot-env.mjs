// DO NOT EDIT - Generated automatically from boot-env.mjs.ts by tessc
import bootPeg from './boot-peg.mjs';
import bootPegAst from './boot-pegast.mjs';
import makeJessie from './quasi-jessie.mjs';
import makeJSON from './quasi-json.mjs';
import makeJustin from './quasi-justin.mjs';
import makePeg from './quasi-peg.mjs';
import makeImporter from './importer.mjs';
import jessieEvaluators from './interp-jessie.mjs';
import makeInterp from './interp-utils.mjs';
import tagString from './tag-string.mjs';
const bootEnv = immunize((endowments, applyMethod, readInput, setComputedIndex) => {
    // Bootstrap a peg tag.
    const pegTag = bootPeg(makePeg, bootPegAst);
    // Stack up the parser.
    const jsonTag = makeJSON(pegTag);
    const justinTag = makeJustin(pegTag.extends(jsonTag));
    const [jessieTag, jessieExprTag] = makeJessie(pegTag, pegTag.extends(justinTag));
    const importer = makeImporter(readInput, jessieTag);
    const interpJessie = makeInterp(jessieEvaluators, applyMethod, importer, setComputedIndex);
    const env = {
        ...endowments,
        confine: (src, evalenv, options = {}) => {
            const ast = tagString(jessieTag, options.scriptName) `${src}`;
            return interpJessie(ast, evalenv, options || {});
        },
        confineExpr: (src, evalenv, options = {}) => {
            const ast = tagString(jessieExprTag, options.scriptName) `${src}`;
            return interpJessie(ast, evalenv, options || {});
        },
        eval: (src) => {
            const ast = tagString(jessieExprTag) `${src}`;
            return interpJessie(ast, env);
        },
    };
    return env;
});
export default immunize(bootEnv);
