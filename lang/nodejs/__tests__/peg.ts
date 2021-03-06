/// <reference path="../node_modules/@types/jest/index.d.ts"/>
/// <reference path="../../../lib/peg.d.ts"/>

import bootPeg from '../../../lib/boot-peg.js';
import bootPegAst from '../../../lib/boot-pegast.js';
import makePeg from '../../../lib/quasi-peg.js';

function defaultPegTag() {
    return bootPeg(makePeg, bootPegAst);
}

test('comments', () => {
    function doArith(peg: IPegTag) {
        const {HOLE, SKIP} = peg;
        return peg`
          start <- expr EOF   ${(v, _) => v};
          expr <-
            term PLUS expr    ${(a, _, b) => (...subs: any[]) => a(...subs) + b(...subs)}
          / term;
          term <-
            NUMBER            ${n => (..._: any[]) => JSON.parse(n)}
          / HOLE              ${h => (...subs: any[]) => subs[h]}
          / LEFT_PAREN expr RIGHT_PAREN      ${(_, v, _2) => v};

          NUMBER <- <MINUS? [0-9]+> WS;
          HOLE <- &${HOLE} WS;
          MINUS <- "-" WS;
          PLUS <- "+" WS;
          LEFT_PAREN <- "(" WS;
          RIGHT_PAREN <- ")" WS;
          WS <- [\t\r\n ]*        ${(_) => SKIP};
          EOF <- ~.;
        `;
    }

    const pegTag = defaultPegTag();
    const arith = doArith(pegTag);
    expect(arith`1 + (-2 + ${3 * 11} + ${55 - 11}) + 4`).toBe(80);
});

test('json', () => {
    const pegTag = defaultPegTag();
    const {HOLE, SKIP} = pegTag;
    const quasiJSON = pegTag`
    start <- value EOF    ${(v, _) => v};
    value <-
      prim                 ${p => (..._: any[]) => JSON.parse(p)}
    / array
    / record                # json.org calls this "object"
    / HOLE                 ${h => (...subs: any[]) => subs[h]};
    prim <- (STRING / NUMBER / "true" / "false" / "null") WS;

    array <- LEFT_BRACKET value ** _COMMA RIGHT_BRACKET
                           ${(_, vs: Array<(...a: any[]) => any>, _2) =>
                             (...subs: any[]) =>
                                vs.map(v => v(...subs))};
    record <- LEFT_BRACE pair ** _COMMA RIGHT_BRACE
                           ${(_, pairs, _2) => (...subs: any[]) => {
                               const result: Record<string, any> = {};
                               for (const [k, v] of pairs) {
                                 result[k(...subs)] = v(...subs);
                               }
                               return result;
                           }};
    pair <- key COLON value ${(k, _, v) => [k, v]};
    key <-
      STRING               ${p => (..._: any[]) => JSON.parse(p)}
    / HOLE                 ${h => (...subs: any[]) => subs[h]};

    NUMBER <- <MINUS? [0-9]+> WS;
    STRING <- <["] (~[\\"] .)* ["]> WS;
    HOLE <- &${HOLE} WS;
    MINUS <- "-" WS;
    _COMMA <- "," WS        ${(_) => SKIP};
    COLON <- ":" WS;
    LEFT_BRACKET <- "[" WS;
    RIGHT_BRACKET <- "]" WS;
    LEFT_BRACE <- "{" WS;
    RIGHT_BRACE <- "}" WS;
    WS <- [\t\r\n ]*        ${(_) => SKIP};
    EOF <- ~.;
    `;

    const piece = quasiJSON`{${"foo"}: [${33}, 44]}`;
    expect(piece).toEqual({foo: [33, 44]});

    const JSON_PLUS = pegTag.extends(quasiJSON)`
    start <- super.start;
    key <-
      super.key
    / IDENT                ${id => (..._: any[]) => id};

    IDENT <- < [A-Za-z_] [A-Za-z0-9_]* > WS;
    `;

    const thing = JSON_PLUS`{"bar": ${piece}, baz: [55]}`;
    expect(thing).toEqual({bar: piece, baz: [55]});
});

test('scannerish', () => {
    const pegTag = defaultPegTag();
    const {HOLE, SKIP} = pegTag;
    const scannerish = pegTag`
    start <- token* EOF     ${toks => (..._: any[]) => toks};
    token <- ("he" / "++" / NUMBER / CHAR / HOLE) WS;

    NUMBER <- <[0-9]+> WS;
    CHAR <- . WS;
    HOLE <- &${HOLE} WS;
    WS <- [\t\r\n ]*        ${(_) => SKIP};
    EOF <- ~.;
      `;

    const tks = scannerish`33he llo${3}w ++ orld`;
    expect(tks).toEqual(["33", 'he', 'l', 'l', 'o', 0, 'w', '++', 'o', 'r', 'l', 'd']);
});

test('error', () => {
  const pegTag = defaultPegTag();
  const parser = pegTag`
    start <- token* EOF ${toks => (..._: any[]) => toks};
    token <- "abc" / "adb";
    EOF <- ~.;
  `;

  expect(parser`abcadbadbabc`).toEqual(['abc', 'adb', 'adb', 'abc']);

  // Silence the expected error.
  const oldError = console.error;
  try {
    console.error = (): any => undefined;
    expect(() => parser`abcadbabcadd`).toThrowError('Syntax error at 9 "a" #0:9');
  } finally {
    console.error = oldError;
  }
});
