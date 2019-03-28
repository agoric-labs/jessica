// DO NOT EDIT - Generated automatically from boot-env.mjs.ts by tessc
import $i_bootPeg from './boot-peg.mjs';const bootPeg = immunize($i_bootPeg);
import $i_bootPegAst from './boot-pegast.mjs';const bootPegAst = immunize($i_bootPegAst);
import $i_makeJessie from './quasi-jessie.mjs';const makeJessie = immunize($i_makeJessie);
import $i_makeJSON from './quasi-json.mjs';const makeJSON = immunize($i_makeJSON);
import $i_makeJustin from './quasi-justin.mjs';const makeJustin = immunize($i_makeJustin);
import $i_makePeg from './quasi-peg.mjs';const makePeg = immunize($i_makePeg);

import $i_makeImporter from './importer.mjs';const makeImporter = immunize($i_makeImporter);
import $i_jessieEvaluators from './interp-jessie.mjs';const jessieEvaluators = immunize($i_jessieEvaluators);
import $i_makeInterp from './interp-utils.mjs';const makeInterp = immunize($i_makeInterp);
import $i_tagString from './tag-string.mjs';const tagString = immunize($i_tagString);

const bootEnv = immunize((
endowments,
applyMethod,
readInput,
setComputedIndex) => {
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
      let tag = tagString(jessieTag, options.scriptName);
      if (options.debug) {
        tag = tag('DEBUG');
      }
      const ast = tag`${src}`;
      return interpJessie(ast, evalenv, options || {}).default;
    },
    confineExpr: (src, evalenv, options = {}) => {
      let tag = tagString(jessieExprTag, options.scriptName);
      if (options.debug) {
        tag = tag('DEBUG');
      }
      const ast = tag`${src}`;
      return interpJessie(ast, evalenv, options || {});
    },
    eval: src => {
      return confineExpr(src, env);
    } };

  return env;
});

export default immunize(bootEnv);