// DO NOT EDIT - Generated automatically from translate.mjs.ts by tessc
import $i_bootPeg from './boot-peg.mjs';const bootPeg = immunize($i_bootPeg);
import $i_bootPegAst from './boot-pegast.mjs';const bootPegAst = immunize($i_bootPegAst);
import $i_makePeg from './quasi-peg.mjs';const makePeg = immunize($i_makePeg);

import $i_makeJessieModule from './quasi-jessie-module.mjs';const makeJessieModule = immunize($i_makeJessieModule);
import $i_makeJessie from './quasi-jessie.mjs';const makeJessie = immunize($i_makeJessie);
import $i_makeJSON from './quasi-json.mjs';const makeJSON = immunize($i_makeJSON);
import $i_makeJustin from './quasi-justin.mjs';const makeJustin = immunize($i_makeJustin);
import $i_rewriteModuleDefine from './rewrite-define.mjs';const rewriteModuleDefine = immunize($i_rewriteModuleDefine);
import $i_tagString from './tag-string.mjs';const tagString = immunize($i_tagString);

const pegTag = immunize(bootPeg(makePeg, bootPegAst));
const jsonTag = immunize(makeJSON(pegTag));
const justinTag = immunize(makeJustin(pegTag.extends(jsonTag)));
const [jessieTag] = immunize(makeJessie(pegTag, pegTag.extends(justinTag)));
const jessieModuleTag = immunize(makeJessieModule(pegTag.extends(jessieTag)));



































export const translate = immunize((sourceText, parameters) =>

makePromise(resolve => {
  const { sourceType, target, targetType } = parameters;
  if (sourceType !== 'jessie') {
    throw slog.error`Unrecognized sourceType: ${{ sourceType }}`;
  }
  if (target !== 'jessie-frame') {
    throw slog.error`Unrecognized target: ${{ target }}`;
  }

  switch (targetType) {
    case 'function':{
        const tag = tagString(jessieModuleTag, parameters.sourceURL);

        // Throw an exception if the sourceText doesn't parse.
        const moduleAst = tag`${sourceText}`;

        // Rewrite the ESM imports/exports into an SES-honouring AMD form.
        const translatedText = rewriteModuleDefine(moduleAst, '$h_define');
        const result = {
          ...parameters,
          translatedText };

        return resolve(result);
      }
    case 'module':{
        const tag = tagString(jessieTag, parameters.sourceURL);

        // Throw an exception if the sourceText doesn't parse.
        tag`${sourceText}`;

        // Return the sourceText verbatim.
        const result = {
          ...parameters,
          translatedText: sourceText };

        return resolve(result);
      }
    default:{
        throw slog.error`Unrecognized targetType: ${{ targetType }}`;
      }}


}));