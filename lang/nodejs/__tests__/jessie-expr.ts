/// <reference path="../node_modules/@types/jest/index.d.ts"/>
/// <reference path="../../../lib/peg.d.ts"/>
import bootPeg from '../../../lib/boot-peg.js';
import bootPegAst from '../../../lib/boot-pegast.js';
import makePeg from '../../../lib/quasi-peg.js';

import makeInsulatedJessie from '../../../lib/quasi-insulate.js';
import makeJessie from '../../../lib/quasi-jessie.js';
import makeJSON from '../../../lib/quasi-json.js';
import makeJustin from '../../../lib/quasi-justin.js';
import {ast, makeParser} from './parser-utils';

function defaultJessieExprParser() {
  const pegTag = bootPeg(makePeg, bootPegAst);
  const jsonTag = makeJSON(pegTag);
  const justinTag = makeJustin(pegTag.extends(jsonTag));
  const [rawJessieTag] = makeJessie(pegTag, pegTag.extends(justinTag));
  const jessieTag = makeInsulatedJessie(pegTag, pegTag.extends(rawJessieTag));
  return makeParser(jessieTag[1]);
}

test('get/set', () => {
    const parse = defaultJessieExprParser();
    expect(parse(`function doit() { return bar.abcd; }`)).toEqual(
        ast(0, 'functionExpr', ast(9, 'def', 'doit'), [], ast(16, 'block', [
            ast(18, 'return', ast(25, 'get', ast(25, 'use', 'bar'), 'abcd'))
        ])));
    expect(parse(`function doit() { a ? b : c; }`)).toEqual(
        ast(0, 'functionExpr', ast(9, 'def', 'doit'), [], ast(16, 'block', [
            ast(18, 'cond', ast(18, 'use', 'a'), ast(22, 'use', 'b'), ast(26, 'use', 'c'))
        ])));
    expect(parse(`function doit() { foo[1] = c; }`)).toEqual(
        ast(0, 'functionExpr', ast(9, 'def', 'doit'), [], ast(16, 'block', [
            ast(18, '=', ast(18, 'index', ast(18, 'use', 'foo'), ast(22, 'data', 1)), ast(27, 'use', 'c'))
        ])));
});

test('quasi', () => {
    const parse = defaultJessieExprParser();
    expect(parse('myTag`hello ${{MODULE}}: ${e}`')).toEqual(
        ast(0, 'tag', ast(0, 'use', 'myTag'),
            ast(5, 'quasi', [
                'hello ',
                ast(14, 'record', [
                    ast(15, 'prop', 'MODULE', ast(15, 'use', 'MODULE'))
                ]),
                ': ',
                ast(27, 'use', 'e'),
                ''
            ])));
});
