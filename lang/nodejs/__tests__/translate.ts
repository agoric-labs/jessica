/// <reference path="../node_modules/@types/jest/index.d.ts"/>
import {IJessicaResourceParameters, translate} from '../../../lib/translate.js';

const params: IJessicaResourceParameters = {
    remoteURL: 'http://usercontent.example.org/hash-1234/myscript.js',
    sourceType: 'jessie',
    sourceURL: 'http://example.org/myscript.js',
    target: 'jessie-frame',
    targetType: 'function',
};

const modParams: IJessicaResourceParameters = {
    ...params,
    targetType: 'module',
};

test('sanity', async () => {
    const translatedText = `$h_define(
[],
() => {
const $h_exports = {};
$h_exports.default = insulate(() => 'hello world');
return $h_exports;
})`;
    expect(await translate(`export default insulate(() => 'hello world');`, params)).toEqual({
        ...params,
        translatedText,
    });
    const module = `export default insulate(() => 'hello world');`;
    expect(await translate(module, modParams)).toEqual({
        ...modParams,
        translatedText: module,
    });
});

test('imports', async () => {
    const translatedText = `$h_define(
["./foo"],
($h_star0) => {
const $h_exports = {};
const {default: $i_foo} = $h_star0;
const foo = insulate($i_foo);
$h_exports.default = insulate(foo);
return $h_exports;
})`;
    expect(await translate(`import $i_foo from './foo';
const foo = insulate($i_foo);
export default insulate(foo);
`,
        params)).toEqual({
            ...params,
            translatedText,
        });

    const translatedText2 = `$h_define(
["./foo"],
($i_bitzy) => {
const $h_exports = {};
const {default: $i_foo} = $i_bitzy;
const foo = insulate($i_foo), {bat, boz} = insulate($i_bitzy);
$h_exports.foo = foo;
$h_exports.bat = bat;
$h_exports.boz = boz;
$h_exports.default = insulate(boz);
return $h_exports;
})`;
    expect(await translate(`import $i_foo, * as $i_bitzy from './foo';
export const foo = insulate($i_foo), {bat, boz} = insulate($i_bitzy);
export default insulate(boz);
`,
        params)).toEqual({
            ...params,
            translatedText: translatedText2,
        });
    });
