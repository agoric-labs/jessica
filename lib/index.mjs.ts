import bootPeg from './boot-peg.mjs';
import bootPegAst from './boot-pegast.mjs';
import makePeg from './quasi-peg.mjs';

import makeJessie from './quasi-jessie.mjs';
import makeJSON from './quasi-json.mjs';
import makeJustin from './quasi-justin.mjs';

import tagString from './tag-string.mjs';

const pegTag = bootPeg(makePeg, bootPegAst);
const jsonTag = makeJSON(pegTag);
const justinTag = makeJustin(pegTag.extends(jsonTag));
const [jessieTag] = makeJessie(pegTag, pegTag.extends(justinTag));

type Targets = 'jessie-frame';
type SourceTypes = 'jessie';
type TargetTypes = 'module';

interface ISerializableJessicaParameters {
    // The kind of output we want from the `translate` function.
    target: Targets;
    targetType: TargetTypes;
}

interface IResourceRequestParameters {
    // Same base as the frame's Service Worker scope.
    // https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit?hl=en_US&pli=1&pli=1
    sourceURL: string;

    sourceType: SourceTypes;

    // Where the resource is actually fetched from by the Service Worker.
    remoteURL: string;
}

interface IJessicaResourceParameters
    extends ISerializableJessicaParameters, IResourceRequestParameters {

}

// TODO: Eventually, allow asynchrony, too.
type readable = string;

interface IJessicaTranslationResult extends IJessicaResourceParameters {
    // These are the compiler outputs:
    translatedText: readable;
}

export const translate = (sourceText: readable, parameters: IJessicaResourceParameters):
    Promise<IJessicaTranslationResult> =>
    makePromise(resolve => {
        const tag = tagString(jessieTag, parameters.sourceURL);
        // Throw an exception if the sourceText doesn't parse.
        tag`${sourceText}`;
        // For now, return the source text verbatim.
        const result: IJessicaTranslationResult = {
            ...parameters,
            translatedText: sourceText,
        };
        resolve(result);
    });
