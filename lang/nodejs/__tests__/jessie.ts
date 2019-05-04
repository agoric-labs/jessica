/// <reference path="../node_modules/@types/jest/index.d.ts"/>
/// <reference path="../../../lib/peg.d.ts"/>
import bootPeg from '../../../lib/boot-peg.js';
import bootPegAst from '../../../lib/boot-pegast.js';
import makePeg from '../../../lib/quasi-peg.js';

import makeJessie from '../../../lib/quasi-jessie.js';
import makeJSON from '../../../lib/quasi-json.js';
import makeJustin from '../../../lib/quasi-justin.js';
import {ast, makeParser} from './parser-utils';

function defaultJessieParser() {
  const pegTag = bootPeg(makePeg, bootPegAst);
  const jsonTag = makeJSON(pegTag);
  const justinTag = makeJustin(pegTag.extends(jsonTag));
  const [jessieTag] = makeJessie(pegTag, pegTag.extends(justinTag));
  return makeParser(jessieTag);
}

test('conciseMethod', () => {
    const parse = defaultJessieParser();
    expect(parse(`export default insulate({def(abc) { return abc; }, ghi() { }});`)).toEqual(['module', [
        ast(0, 'exportDefault', ast(15, 'call', ['use', 'insulate'], [
            ast(24, 'record', [
                ast(25, 'method', 'def', [ast(29, 'def', 'abc')],
                    ast(34, 'block', [ast(36, 'return', ast(43, 'use', 'abc'))])),
                ast(51, 'method', 'ghi', [], ast(57, 'block', []))
            ])
        ]))
    ]]);
});

test('switch', () => {
    const parse = defaultJessieParser();
    expect(parse(`export default insulate(() => {
        switch (e) {
            case 'b':{
                q = '\\b';
                break;
              }
        }
    });`)).toEqual(['module', [
        ast(0, 'exportDefault', ast(15, 'call', ['use', 'insulate'], [
            ast(24, 'arrow', ast(24), ast(30, 'block', [
                ast(40, 'switch', ast(48, 'use', 'e'), [
                    ast(65, 'clause', [ast(65, 'case', ast(70, 'data', 'b'))],
                        ast(92, 'block', [
                            ast(92, '=', ast(92, 'use', 'q'), ast(96, 'data', '\b')),
                            ast(118, 'break')
                        ]))
                    ])
                ]))
            ]))
        ]]);
});

test('quasi', () => {
    const parse = defaultJessieParser();
    expect(parse(`export default insulate(() => { bar.foo\`baz \${1} \${2}\`; });`)).toEqual(['module', [
        ast(0, 'exportDefault', ast(15, 'call', ['use', 'insulate'], [
            ast(24, 'arrow', ast(24), ast(30, 'block', [
                ast(32, 'tag', ['get', ast(32, 'use', 'bar'), "foo"],
                    ast(39, 'quasi', ['baz ', ast(46, 'data', 1), ' ', ast(51, 'data', 2), ''])
            )]))
        ]))
    ]]);
});

test('insulate', () => {
    const parse = defaultJessieParser();
    expect(parse(`export default insulate(a);`)).toEqual(['module', [
        ast(0, 'exportDefault', ast(15, 'call', ['use', 'insulate'], [
            ast(24, 'use', 'a')
        ]))
    ]]);
});

test('exports', () => {
    const parse = defaultJessieParser();
    expect(parse(`export default 123;`)).toEqual(['module', [
        ast(0, 'exportDefault', ast(15, 'data', 123))
    ]]);
});
