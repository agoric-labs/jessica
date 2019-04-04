/// <reference path="../node_modules/@types/jest/index.d.ts"/>
import '../globalEnv.mjs';

import {IJessicaResourceParameters, translate} from '../../../lib/translate.mjs';

const params: IJessicaResourceParameters = {
    remoteURL: 'http://usercontent.example.org/hash-1234/myscript.mjs',
    sourceType: 'jessie',
    sourceURL: 'http://example.org/myscript.mjs',
    target: 'jessie-frame',
    targetType: 'function',
};

const modParams: IJessicaResourceParameters = {
    ...params,
    targetType: 'module',
}

test('sanity', async () => {
    const translatedText = `\$h_define(
[],
() => {
const \$h_exports = {};
\$h_exports.default = immunize(() => 'hello world');
return \$h_exports;
});`;
    expect(await translate(`export default immunize(() => 'hello world');`, params)).toEqual({
        ...params,
        translatedText,
    });
    const module = `export default immunize(() => 'hello world');`;
    expect(await translate(module, modParams)).toEqual({
        ...modParams,
        translatedText: module,
    });
});
