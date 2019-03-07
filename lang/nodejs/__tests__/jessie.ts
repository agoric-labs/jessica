/// <reference types="jest"/>
import '../globalEnv.mjs';

import bootPeg from '../../../lib/boot-peg.mjs';
import bootPegAst from '../../../lib/boot-pegast.mjs';
import '../../../lib/peg.mjs';
import makePeg from '../../../lib/quasi-peg.mjs';

import makeJessie from '../../../lib/quasi-jessie.mjs';
import makeJSON from '../../../lib/quasi-json.mjs';
import makeJustin from '../../../lib/quasi-justin.mjs';
import tagString from '../../../lib/tag-string.mjs';

function defaultJessieTag() {
    const pegTag = bootPeg(makePeg, bootPegAst);
    const jsonTag = makeJSON(pegTag);
    const justinTag = makeJustin(pegTag.extends(jsonTag));
    const jessieTag = makeJessie(pegTag.extends(justinTag));
    return tagString(jessieTag);
}

test('get/set', () => {
    const jessieTag = defaultJessieTag();
    expect(jessieTag`function doit() { return bar.abcd; }`).toEqual(['module', [
        ['functionDecl', ['def', 'doit'], [], ['block',
            [['return', ['get', ['use', 'bar'], 'abcd']]]]]
    ]]);
    expect(jessieTag('DEBUG')`function doit() { foo[1] = 123; }`).toEqual([]);
});
