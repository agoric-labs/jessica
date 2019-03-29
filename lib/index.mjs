// DO NOT EDIT - Generated automatically from index.mjs.ts by tessc
import $i_bootPeg from './boot-peg.mjs';const bootPeg = immunize($i_bootPeg);
import $i_bootPegAst from './boot-pegast.mjs';const bootPegAst = immunize($i_bootPegAst);
import $i_makePeg from './quasi-peg.mjs';const makePeg = immunize($i_makePeg);

import $i_makeJessie from './quasi-jessie.mjs';const makeJessie = immunize($i_makeJessie);
import $i_makeJSON from './quasi-json.mjs';const makeJSON = immunize($i_makeJSON);
import $i_makeJustin from './quasi-justin.mjs';const makeJustin = immunize($i_makeJustin);

import $i_tagString from './tag-string.mjs';const tagString = immunize($i_tagString);

const pegTag = immunize(bootPeg(makePeg, bootPegAst));
const jsonTag = immunize(makeJSON(pegTag));
const justinTag = immunize(makeJustin(pegTag.extends(jsonTag)));
const [jessieTag] = immunize(makeJessie(pegTag, pegTag.extends(justinTag)));



































export const translate = immunize((sourceText, parameters) =>

makePromise(resolve => {
  const tag = tagString(jessieTag, parameters.sourceURL);
  // Throw an exception if the sourceText doesn't parse.
  tag`${sourceText}`;
  // For now, return the source text verbatim.
  const result = {
    ...parameters,
    translatedText: sourceText };

  resolve(result);
}));