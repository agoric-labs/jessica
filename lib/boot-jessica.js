import { insulate } from '@agoric/jessie'; // These are exported explicitly below.
/// <reference path="../typings/jessie-proposed.d.ts"/>
import { harden, insulate as rawInsulate, makeMap, makePromise,
makeSet, makeWeakMap, makeWeakSet } from '@agoric/jessie';
import { slog as $i_slog } from '@michaelfig/slog';const slog = insulate($i_slog);

import $i_bootPeg from './boot-peg.js';const bootPeg = insulate($i_bootPeg);
import $i_bootPegAst from './boot-pegast.js';const bootPegAst = insulate($i_bootPegAst);
import $i_makeInsulatedJessie from './quasi-insulate.js';const makeInsulatedJessie = insulate($i_makeInsulatedJessie);
import $i_makeJessie from './quasi-jessie.js';const makeJessie = insulate($i_makeJessie);
import $i_makeJSON from './quasi-json.js';const makeJSON = insulate($i_makeJSON);
import $i_makeJustin from './quasi-justin.js';const makeJustin = insulate($i_makeJustin);
import $i_makePeg from './quasi-peg.js';const makePeg = insulate($i_makePeg);

import $i_makeImporter from './importer.js';const makeImporter = insulate($i_makeImporter);
import $i_jessieEvaluators from './interp-jessie.js';const jessieEvaluators = insulate($i_jessieEvaluators);
import $i_makeInterp from './interp-utils.js';const makeInterp = insulate($i_makeInterp);
import $i_tagString from './tag-string.js';const tagString = insulate($i_tagString);



const bootJessica = insulate((
applyMethod,
readInput,
setComputedIndex) => {
  // Bootstrap a peg tag.
  const pegTag = bootPeg(makePeg, bootPegAst);

  // Stack up the parser.
  const jsonTag = makeJSON(pegTag);
  const justinTag = makeJustin(pegTag.extends(jsonTag));
  const [rawJessieTag] = makeJessie(pegTag, pegTag.extends(justinTag));

  // FIXME: The insulated Jessie tag.
  const [jessieTag, jessieExprTag] = makeInsulatedJessie(pegTag, pegTag.extends(rawJessieTag));

  // No, this isn't an empty Map.
  // (It's initialized after jessica.runExpr is defined.)
  const importCache = makeMap();
  const importer = makeImporter(importCache, readInput, jessieTag);
  const interpJessie = makeInterp(jessieEvaluators, applyMethod, importer, setComputedIndex);

  const jessica = {
    eval: src => {
      // Don't inherit any endowments.
      return jessica.runExpr(src, {});
    },
    runExpr: (src, env = {}, options = {}) => {
      let tag = tagString(jessieExprTag, options.scriptName);
      if (options.debug) {
        tag = tag('DEBUG');
      }
      const ast = tag`${src}`;
      const evalenv = { eval: jessica.eval, ...env };
      return interpJessie(ast, evalenv, options || {});
    },
    runModule: (src, env = {}, options = {}) => {
      let tag = tagString(jessieTag, options.scriptName);
      if (options.debug) {
        tag = tag('DEBUG');
      }
      const ast = tag`${src}`;
      const evalenv = { eval: jessica.eval, ...env };
      return interpJessie(ast, evalenv, options || {}).default;
    } };


  // Only allow the Jessie library we know about, with a self-hosted
  // confine and confineExpr.
  const jessie = harden({
    confine(src, env, options = {}) {
      // Evaluate as an IIFE, but return nothing.
      jessica.runExpr(`(()=>{${src}
;})()`, env, options);
    },
    confineExpr: jessica.runExpr,
    harden,
    insulate(warmTarget) {
      // Don't insulate our existing targets.
      if (jessieTargets.has(warmTarget)) {
        return warmTarget;
      }
      return rawInsulate(warmTarget);
    },
    makeMap,
    makePromise,
    makeSet,
    makeWeakMap,
    makeWeakSet });

  const jessieTargets = makeSet(Object.values(jessie));
  importCache.set('@agoric/jessie', harden(jessie));

  // The default slog is also allowed.
  importCache.set('@michaelfig/slog', Object.freeze({ slog }));
  return jessica;
});

export default bootJessica;