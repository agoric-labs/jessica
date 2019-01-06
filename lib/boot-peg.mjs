// A lot of this code is lifted from:
// https://github.com/erights/quasiParserGenerator/tree/master/src/bootbnf.js

import indent from './indent.mjs';

function bootPeg(makePeg, bootPegAst) {
    function compile(sexp) {
        let numSubs = 0;              // # of holes implied by sexp, so far
        const tokenTypes = new Set(); // Literal tokens in sexp, so far

        // generated names
        // act_${i}      action parameter
        // rule_${name}  method from bnf rule
        // seq_${i}      sequence failure label
        // or_${i}       choice success label
        // pos_${i}      backtrack token index
        // s_${i}        accumulated list of values
        // v_${i}        set to s_${i} on fall thru path

        let alphaCount = 0;
        const vars = ['let value = FAIL'];
        function nextVar(prefix) {
            const result = `${prefix}_${alphaCount++}`;
            vars.push(result);
            return result;
        }
        function takeVarsSrc() {
            const result = `${vars.join(', ')};`;
            vars.length = 1;
            return result;
        }
        function nextLabel(prefix) {
            return `${prefix}_${alphaCount++}`;
        }


        const vtable = Object.freeze({
            peg(...rules) {
                // The following line also initializes tokenTypes and numSubs
                const rulesSrc = rules.map(peval).join('\n');

                const paramSrcs = [];
                for (let i = 0; i < numSubs; i++) {
                    paramSrcs.push(`act_${i}`);
                }
                const tokenTypeListSrc =
                    `[${[...tokenTypes].map(tt => JSON.stringify(tt)).join(', ')}]`;
                // rules[0] is the ast of the first rule, which has the form
                // ["def", ruleName, body], so rules[0][1] is the name of
                // the start rule. We prepend "rule_" to get the name of the
                // JS method that implements the start rule. We invoke it
                // with (0) so that it will parse starting at position 0. It
                // returns a pair of the final position (after the last
                // non-EOF token parsed), and the semantic value. On failure
                // to parse, the semantic value will be FAIL.
                const name = rules[0][1];
                return indent`
    (function(${paramSrcs.join(', ')}) {
      return BaseParser => class extends BaseParser {
        constructor(template, tokenTypeList=[]) {
          super(template, ${tokenTypeListSrc}.concat(tokenTypeList));
        }
        start() {
          const pair = RUN(self.rule_${name}, 0, ${JSON.stringify(name)});
          if (pair[1] === FAIL) {
            ERROR();
          }
          return pair[1];
        }
        ${rulesSrc}
      }
    })
    `;
            },
            def(name, body) {
                const bodySrc = peval(body);
                return indent`
    rule_${name}(pos) {
      ${takeVarsSrc()}
      ${bodySrc}
      return [pos, value];
    }`;
            },
            empty() {
                return `value = [];`;
            },
            fail() {
                return `value = FAIL;`;
            },
            or(...choices) {
                const labelSrc = nextLabel('or');
                const choicesSrc = choices.map(peval).map(cSrc => indent`
    ${cSrc}
    if (value !== FAIL) break ${labelSrc};`).join('\n');

                return indent`
    ${labelSrc}: {
      ${choicesSrc}
    }`;
            },
            seq(...terms) {
                const posSrc = nextVar('pos');
                const labelSrc = nextLabel('seq');
                const sSrc = nextVar('s');
                const vSrc = nextVar('v');
                const termsSrc = terms.map(peval).map(termSrc => indent`
    ${termSrc}
    if (value === FAIL) break ${labelSrc};
    ${sSrc}.push(value);`).join('\n');

                return indent`
    ${sSrc} = [];
    ${vSrc} = FAIL;
    ${posSrc} = pos;
    ${labelSrc}: {
      ${termsSrc}
      ${vSrc} = ${sSrc};
    }
    if ((value = ${vSrc}) === FAIL) pos = ${posSrc};`;
            },
            act(terms, hole) {
                numSubs = Math.max(numSubs, hole + 1);
                const termsSrc = (1,vtable.seq)(...terms);
                return indent`
    ${termsSrc}
    if (value !== FAIL) value = act_${hole}(...value);`;
            },
            '**'(patt, sep) {
                // for backtracking
                const posSrc = nextVar('pos');
                // a non-advancing success only repeats once.
                const startSrc = nextVar('pos');
                const sSrc = nextVar('s');
                const pattSrc = peval(patt);
                const sepSrc = peval(sep);
                // after first iteration, backtrack to before the separator
                return indent`
    ${sSrc} = [];
    ${posSrc} = pos;
    while (true) {
      ${startSrc} = pos;
      ${pattSrc}
      if (value === FAIL) {
        pos = ${posSrc};
        break;
      }
      ${sSrc}.push(value);
      ${posSrc} = pos;
      ${sepSrc}
      if (value === FAIL) break;
      if (pos === ${startSrc}) break;
    }
    value = ${sSrc};`;
            },
            '++'(patt, sep) {
                const starSrc = vtable['**'](patt, sep);
                return indent`
    ${starSrc}
    if (value.length === 0) value = FAIL;`;
            },
            '?'(patt) {
                return vtable['**'](patt, ['fail']);
            },
            '*'(patt) {
                return vtable['**'](patt, ['empty']);
            },
            '+'(patt) {
                return vtable['++'](patt, ['empty']);
            },
            'super'(ident) {
                return `[pos, value] = RUN(super.rule_${ident}, pos, ${
                    JSON.stringify(ident)});`;
            },
            apply(hole) {
                numSubs = Math.max(numSubs, hole + 1);
                return `[pos, value] = act_${hole}(self, pos);`;
            }
        });

        function peval(sexp) {
            if (typeof sexp === 'string') {
                // We only match idents... literal strings are protected
                // by ['lit', s].
                const nameStr = JSON.stringify(sexp);
                return `[pos, value] = RUN(self.rule_${sexp}, pos, ${nameStr});`;
            }
            const op = vtable[sexp[0]];
            if (!op) {
                throw `Cannot find ${sexp[0]} in vtable`;
            }
            return op(...sexp.slice(1));
        }

        return peval(sexp);
    }

    function quasiMemo(quasiCurry) {
        const wm = new WeakMap();
        return function (template, ...subs) {
            let quasiRest = wm.get(template);
            if (!quasiRest) {
                quasiRest = quasiCurry(template);
                wm.set(template, quasiRest);
            }
            if (typeof quasiRest !== 'function') {
                throw new Error(`${typeof quasiRest}: ${quasiRest}`);
            }
            return quasiRest(...subs);
        };
    }

    function quasifyParser(Parser) {
        function baseCurry(template) {
            const parser = new Parser(template);
            let pair = null;
            try {
                pair = parser.start();
            } finally {
                parser.done();  // hook for logging debug output
            }
            return pair;
        }
        const quasiParser = quasiMemo(baseCurry);
        quasiParser.Parser = Parser;
        return quasiParser;
    }

    // We don't have any productions in the base grammar: everything is
    // explicit.
    const defaultBaseGrammar = harden({
        Parser: makeMap(),
    });

    function metaCompile(baseRules, _ = void 0) {
        const baseAST = ['peg', ...baseRules];
        const parserTraitMakerSrc = compile(baseAST);
        // console.error('\n\n' + parserTraitMakerSrc + '\n\n');
        const FAIL = () => 'FAIL ME';
        const makeParserTrait = confine(parserTraitMakerSrc, {
            FAIL,
            RUN: (rule, n, name) => {throw `Would run ${rule}, ${name}`},
            ERROR: () => {throw `Syntax error!`},
        });
        return function (...baseActions) {
            const parserTrait = makeParserTrait(...baseActions);
            function _asExtending(baseQuasiParser) {
                const Parser = parserTrait(baseQuasiParser.Parser);

                const pegTag = quasifyParser(Parser);

                // These predicates are needed by our extended grammars.
                pegTag.ACCEPT = (parser, input) => { throw `Would accept!`; };
                pegTag.BEGIN = (parser, input) => { throw `Would begin!`; };
                pegTag.END = (parser, input) => { throw `Would end!`; };
                pegTag.FAIL = FAIL;
                pegTag.HOLE = (parser, input) => { throw `Would match hole!`; };

                return pegTag;
            }
            const quasiParser = _asExtending(defaultBaseGrammar);
            quasiParser._asExtending = _asExtending;
            function _extends(baseQuasiParser) {
                return (template, ...subs) =>
                    quasiParser(template, ...subs)._asExtending(baseQuasiParser);
            }
            quasiParser.extends = _extends;
            return quasiParser;
        };
    }

    // Get the actions from makePeg.
    const pegActions = makePeg((_, ...actions) => actions);

    // Bootstrap the compiler with the precompiled bootPegAst.
    const bootPegTag = metaCompile(bootPegAst)(...pegActions);

    return harden({ bootPegTag, metaCompile });
}

export default harden(bootPeg);
