/// <reference types="jest"/>
/// <reference path="../../../lib/peg.d.ts"/>
import '../globalEnv.mjs';

import bootPeg from '../../../lib/boot-peg.mjs';
import bootPegAst from '../../../lib/boot-pegast.mjs';
import makePeg from '../../../lib/quasi-peg.mjs';

import makeJSON from '../../../lib/quasi-json.mjs';
import tagString from '../../../lib/tag-string.mjs';

function defaultJsonTag() {
  const pegTag = bootPeg(makePeg, bootPegAst);
  const jsonTag = makeJSON(pegTag);
  return tagString(jsonTag);
}

test('data', () => {
  const jsonTag = defaultJsonTag();
  expect(jsonTag`{}`).toEqual(['record']);
  expect(jsonTag`[]`).toEqual(['array']);
  expect(jsonTag`{"abc": 123}`).toEqual(['record',
    [['prop', ['data', 'abc'], ['data', 123]]]]);
  expect(jsonTag`["abc", 123]`).toEqual(['array', [['data', 'abc'], ['data', 123]]]);
  expect(jsonTag`123`).toEqual(['data', 123]);
  // expect(jsonTag`"\f\r\n\t\b"`).toBe(['data', '\f\r\n\t\b']);
});
