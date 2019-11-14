import { makePromise } from '@agoric/jessie';
import { slog } from '@michaelfig/slog';

import bootPeg from './boot-peg.js';
import bootPegAst from './boot-pegast.js';
import makePeg from './quasi-peg.js';

import makeJessieModule from './quasi-jessie-module.js';
import makeInsulatedJessie from './quasi-insulate.js';
import makeJessie from './quasi-jessie.js';
import makeJSON from './quasi-json.js';
import makeJustin from './quasi-justin.js';
import rewriteModuleDefine from './rewrite-define.js';
import tagString from './tag-string.js';

const pegTag = bootPeg(makePeg, bootPegAst);
const jsonTag = makeJSON(pegTag);
const justinTag = makeJustin(pegTag.extends(jsonTag));
const [rawJessieTag] = makeJessie(pegTag, pegTag.extends(justinTag));
const [jessieTag] = makeInsulatedJessie(pegTag, pegTag.extends(rawJessieTag));
const jessieModuleTag = makeJessieModule(pegTag.extends(jessieTag));

export type Targets = 'jessie-frame';
export type SourceTypes = 'jessie';
export type TargetTypes = 'function' | 'module';

export interface ISerializableJessicaParameters {
    // The kind of output we want from the `translate` function.
    target: Targets;
    targetType: TargetTypes;
}

export interface IResourceRequestParameters {
    // Same base as the frame's Service Worker scope.
    // https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit?hl=en_US&pli=1&pli=1
    sourceURL: string;

    sourceType: SourceTypes;

    // Where the resource is actually fetched from by the Service Worker.
    remoteURL: string;
}

export interface IJessicaResourceParameters
    extends ISerializableJessicaParameters, IResourceRequestParameters {

}

// TODO: Eventually, allow asynchrony, too.
export type Readable = string;

interface IJessicaTranslationResult extends IJessicaResourceParameters {
    // These are the compiler outputs:
    translatedText: Readable;
}

export const translate = (sourceText: Readable, parameters: IJessicaResourceParameters):
    Promise<IJessicaTranslationResult> =>
    makePromise(resolve => {
        const {sourceType, target, targetType} = parameters;
        if (sourceType !== 'jessie') {
            throw slog.error`Unrecognized sourceType: ${{sourceType}}`;
        }
        if (target !== 'jessie-frame') {
            throw slog.error`Unrecognized target: ${{target}}`;
        }

        switch (targetType) {
        case 'function': {
            const tag = tagString(jessieModuleTag, parameters.sourceURL);

            // Throw an exception if the sourceText doesn't parse.
            const moduleAst = tag`${sourceText}`;

            // Rewrite the ESM imports/exports into an SES-honouring AMD form.
            const translatedText = rewriteModuleDefine(moduleAst, '$h_define');
            const result: IJessicaTranslationResult = {
                ...parameters,
                translatedText,
            };
            return resolve(result);
        }
        case 'module': {
            const tag = tagString(jessieTag, parameters.sourceURL);

            // Throw an exception if the sourceText doesn't parse.
            tag`${sourceText}`;

            // Return the sourceText verbatim.
            const result: IJessicaTranslationResult = {
                ...parameters,
                translatedText: sourceText,
            };
            return resolve(result);
        }
        default: {
            throw slog.error`Unrecognized targetType: ${{targetType}}`;
        }
        }

    });
