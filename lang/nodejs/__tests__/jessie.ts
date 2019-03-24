/// <reference path="../node_modules/@types/jest/index.d.ts"/>
/// <reference path="../../../lib/peg.d.ts"/>
import '../globalEnv.mjs';

import bootPeg from '../../../lib/boot-peg.mjs';
import bootPegAst from '../../../lib/boot-pegast.mjs';
import makePeg from '../../../lib/quasi-peg.mjs';

import makeJessie from '../../../lib/quasi-jessie.mjs';
import makeJSON from '../../../lib/quasi-json.mjs';
import makeJustin from '../../../lib/quasi-justin.mjs';
import {ast, makeParser} from './parser-utils';

function defaultJessieParser() {
  const pegTag = bootPeg(makePeg, bootPegAst);
  const jsonTag = makeJSON(pegTag);
  const justinTag = makeJustin(pegTag.extends(jsonTag));
  const jessieTag = makeJessie(pegTag.extends(justinTag));
  return makeParser(jessieTag);
}

test('get/set', () => {
    const parse = defaultJessieParser();
    expect(parse(`function doit() { return bar.abcd; }`)).toEqual(['module', [
        ast(0, 'functionDecl', ast(9, 'def', 'doit'), [], ast(16, 'block', [
            ast(18, 'return', ast(25, 'get', ast(25, 'use', 'bar'), 'abcd'))
        ]))
    ]]);
    expect(parse(`function doit() { a ? b : c; }`)).toEqual(['module', [
        ast(0, 'functionDecl', ast(9, 'def', 'doit'), [], ast(16, 'block', [
            ast(18, 'cond', ast(18, 'use', 'a'), ast(22, 'use', 'b'), ast(26, 'use', 'c'))
        ]))
    ]]);
    expect(parse(`function doit() { foo[1] = c; }`)).toEqual(['module', [
        ast(0, 'functionDecl', ast(9, 'def', 'doit'), [], ast(16, 'block', [
            ast(18, '=', ast(18, 'index', ast(18, 'use', 'foo'), ast(22, 'data', 1)), ast(27, 'use', 'c'))
        ]))
    ]]);
});

test('immunize', () => {
    const parse = defaultJessieParser();
    expect(parse(`export default immunize(a);`)).toEqual(['module', [
        ast(0, 'exportDefault', ast(15, 'call', ['use', 'immunize'], [ast(24, 'use', 'a')]))
    ]]);
});

test('exports', () => {
    const parse = defaultJessieParser();
    expect(parse(`export default 123;`)).toEqual(['module', [
        ast(0, 'exportDefault', ast(15, 'data', 123))
    ]]);
});
