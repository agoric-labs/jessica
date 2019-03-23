/// <reference path="../node_modules/@types/jest/index.d.ts"/>
/// <reference path="../../../lib/peg.d.ts"/>
import '../globalEnv.mjs';

import bootPeg from '../../../lib/boot-peg.mjs';
import bootPegAst from '../../../lib/boot-pegast.mjs';
import makePeg from '../../../lib/quasi-peg.mjs';

import makeJSON from '../../../lib/quasi-json.mjs';
import makeJustin from '../../../lib/quasi-justin.mjs';
import tagString from '../../../lib/tag-string.mjs';

function defaultJustinTag() {
  const pegTag = bootPeg(makePeg, bootPegAst);
  const jsonTag = makeJSON(pegTag);
  const justinTag = makeJustin(pegTag.extends(jsonTag));
  return tagString(justinTag);
}

test('data', () => {
  const justinTag = defaultJustinTag();
  expect(justinTag`12345`).toEqual(['data', 12345]);
  expect(justinTag`{}`).toEqual(['record', []]);
  expect(justinTag`[]`).toEqual(['array', []]);
  expect(justinTag`{"abc": 123}`).toEqual(['record',
    [['prop', ['data', 'abc'], ['data', 123]]]]);
  expect(justinTag`["abc", 123]`).toEqual(['array', [['data', 'abc'], ['data', 123]]]);
  expect(justinTag`  /* nothing */ 123`).toEqual(['data', 123]);
  expect(justinTag`// foo
  // bar
  // baz
  123`).toEqual(['data', 123]);
  // expect(jsonTag`"\f\r\n\t\b"`).toBe(['data', '\f\r\n\t\b']);
});

test('binops', () => {
  const justinTag = defaultJustinTag();
  expect(justinTag`2 === 2`).toEqual(['===', ['data', 2], ['data', 2]]);
  expect(justinTag`2 < argv`).toEqual(['<', ['data', 2], ['use', 'argv']]);
  expect(justinTag`argv < 2`).toEqual(['<', ['use', 'argv'], ['data', 2]]);
});
