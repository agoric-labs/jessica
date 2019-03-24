/// <reference path="../node_modules/@types/jest/index.d.ts"/>
/// <reference path="../../../lib/peg.d.ts"/>
import '../globalEnv.mjs';

import bootPeg from '../../../lib/boot-peg.mjs';
import bootPegAst from '../../../lib/boot-pegast.mjs';
import makePeg from '../../../lib/quasi-peg.mjs';

import makeJSON from '../../../lib/quasi-json.mjs';
import {ast, makeParser} from './parser-utils';

function defaultJsonParser() {
  const pegTag = bootPeg(makePeg, bootPegAst);
  const jsonTag = makeJSON(pegTag);
  return makeParser(jsonTag);
}

test('data', () => {
  const parse = defaultJsonParser();
  expect(parse('{}')).toEqual(ast(0, 'record', []));
  expect(parse('[]')).toEqual(ast(0, 'array', []));
  expect(parse('123')).toEqual(ast(0, 'data', 123));
  expect(parse('{"abc": 123}')).toEqual(ast(0, 'record',
    [ast(1, 'prop', ast(1, 'data', 'abc'), ast(8, 'data', 123))]));
  expect(parse('["abc", 123]')).toEqual(ast(0, 'array', [ast(1, 'data', 'abc'), ast(8, 'data', 123)]));
  expect(parse('"\\f\\r\\n\\t\\b"')).toEqual(ast(0, 'data', '\f\r\n\t\b'));
});
