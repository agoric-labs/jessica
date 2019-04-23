import { insulate } from '@agoric/jessie'; import $i_bootPeg from './boot-peg.mjs';const bootPeg = insulate($i_bootPeg);
import $i_bootPegAst from './boot-pegast.mjs';const bootPegAst = insulate($i_bootPegAst);
import $i_makePeg from './quasi-peg.mjs';const makePeg = insulate($i_makePeg);

import $i_makeJessieModule from './quasi-jessie-module.mjs';const makeJessieModule = insulate($i_makeJessieModule);
import $i_makeJessie from './quasi-jessie.mjs';const makeJessie = insulate($i_makeJessie);
import $i_makeJSON from './quasi-json.mjs';const makeJSON = insulate($i_makeJSON);
import $i_makeJustin from './quasi-justin.mjs';const makeJustin = insulate($i_makeJustin);
import $i_rewriteModuleDefine from './rewrite-define.mjs';const rewriteModuleDefine = insulate($i_rewriteModuleDefine);
import $i_tagString from './tag-string.mjs';const tagString = insulate($i_tagString);

const pegTag = insulate(bootPeg(makePeg, bootPegAst));
const jsonTag = insulate(makeJSON(pegTag));
const justinTag = insulate(makeJustin(pegTag.extends(jsonTag)));
const [jessieTag] = insulate(makeJessie(pegTag, pegTag.extends(justinTag)));
const jessieModuleTag = insulate(makeJessieModule(pegTag.extends(jessieTag)));



































export const translate = insulate((sourceText, parameters) =>

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