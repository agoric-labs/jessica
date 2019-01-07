// A lot of this code is lifted from:
// https://github.com/erights/quasiParserGenerator/tree/master/src/bootbnf.js

import indent from './indent.mjs';

function RUN(self, rule, pos, ident) {
    console.error('running', ident);
    return rule(self, pos);
}

function ERROR(self, pos) {
    throw `Syntax error at ${pos}!`;
}

function FIND(template, pos) {
    const numSubs = template.length - 1;
    let relpos = pos;
    for (let segnum = 0; segnum <= numSubs; segnum++) {
        const segment = template[segnum];
        const seglen = segment.length;
        if (relpos < seglen) {
            return [segnum, relpos];
        } else if (relpos === seglen && segnum < numSubs) {
            return segnum;  // as hole number
        }
        relpos -= seglen + 1; // "+1" for the skipped hole
    }
    return undefined;
}

function ACCEPT(self, pos) {
    console.error(`Would accept ${pos}`);
}

function EAT(self, pos, str) {
    const found = FIND(self.template, pos);
    if (Array.isArray(found)) {
        const segment = self.template[found[0]];
        if (typeof str === 'string') {
            if (segment.startsWith(str, found[1])) {
                return [pos + str.length, str];
            }
        }
        else {
            // Just return the next character.
            return [pos + 1, segment[found[1]]];
        }
    }
    return [pos, FAIL];
}

function HOLE(self, pos) {
    const found = FIND(self.template, pos);
    if (typeof found === 'number') {
        return [pos + 1, found];
    }
    return [pos, FAIL];
}

const FAIL = harden({toString: () => 'FAIL'});

function unescape(cs) {
    if (cs !== '\\') {
        return [cs[0], 1];
    }

    // It's an escape.
    let q = cs[1];
    switch (q) {
    case 'a':
        q = '\a';
        break;
    case 'b':
        q = '\b';
        break;
    case 'f':
        q = '\f';
        break;
    case 'n':
        q = '\n';
        break;
    case 'r':
        q = '\r';
        break;
    case 't':
        q = '\t';
        break;
    }

    // FIXME: Handle octal integers.

    return [q, 2];
}

function bootPeg(makePeg, bootPegAst) {
    function compile(sexp) {
        let numSubs = 0;              // # of holes implied by sexp, so far
        const tokenTypes = makeSet(); // Literal tokens in sexp, so far

        // generated names
        // act_${i}      action parameter
        // rule_${name}  method from bnf rule
        // seq_${i}      sequence failure label
        // or_${i}       choice success label
        // pos_${i}      backtrack token index
        // s_${i}        accumulated list of values
        // v_${i}        set to s_${i} on fall thru path

        let alphaCount = 0;
        const vars = ['let value = FAIL, beginPos'];
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
      return BaseParser => template =>
        ({...BaseParser,
        template,
        start: (self) => {
          const pair = RUN(self, self.rule_${name}, 0, ${JSON.stringify(name)});
          if (pair[1] === FAIL) {
            ERROR(self, pair[0]);
          }
          return pair[1];
        },
        ${rulesSrc}
      });
    })
    `;
            },
            def(name, body) {
                const bodySrc = peval(body);
                return indent`
    rule_${name}: (self, pos) => {
      ${takeVarsSrc()}
      ${bodySrc}
      return [pos, value];
    },`;
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
            pred(hole) {
                numSubs = Math.max(numSubs, hole + 1);
                return `console.error('run predicate', ${hole});[pos, value] = act_${hole}(self, pos);`;
            },
            act(seq, hole) {
                numSubs = Math.max(numSubs, hole + 1);
                const [_, ...terms] = seq;
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
                return `[pos, value] = RUN(self, BaseParser.rule_${ident}, pos, ${
                    JSON.stringify(ident)});`;
            },
            // PEG extensions.
            begin() {
                // Mark the current pos.
                return `beginPos = pos; value = [];`;
            },
            end() {
                // Use the specified beginPos to extract a string
                const iSrc = nextVar('i');
                const sSrc = nextVar('str');
                return indent`
    ${iSrc} = beginPos;
    ${sSrc} = '';
    while (${iSrc} < pos) {
        [${iSrc}, value] = EAT(self, ${iSrc});
        ${sSrc} += value;
    }
    value = ${sSrc};`;
            },
            cls(cs) {
                // Character class.
                let classStr = '', i = 0;
                const invert = (cs[i] === '^');
                if (invert) {
                    ++i;
                }
                while (i < cs.length) {
                    const [c, j] = unescape(cs.substr(i));
                    i += j;
                    if (cs[i] === '-') {
                        // It's a range.
                        ++i;
                        const [c2, j] = unescape(cs.substr(i));
                        i += j;
                        const min = c.codePointAt(0);
                        const max = c2.codePointAt(0);
                        for (let k = min; k <= max; k++) {
                            classStr += String.fromCodePoint(k);
                        }
                    }
                    else {
                        classStr += c;
                    }
                }
                const op = invert ? '>=' : '<';
                const srcCs = JSON.stringify(classStr);
                return indent`
    [pos, value] = EAT(self, pos);
    if (value !== FAIL) {
        value = ${srcCs}.indexOf(value) ${op} 0 ? FAIL : value;
    }
                `;
            },
            dot() {
                return indent`
    [pos, value] = EAT(self, pos);
                `;
            },
            lit(str) {
                return indent`
    [pos, value] = EAT(self, pos, ${JSON.stringify(str)});
    `;
            },
            peek(patt) {
                // for backtracking
                const posSrc = nextVar('pos');
                const vSrc = nextVar('v');
                const pattSrc = peval(patt);
                // if the pattern matches, restore, else FAIL
                // always rewind.
                return indent`
    ${posSrc} = pos;
    ${vSrc} = value;
    ${pattSrc}
    if (value !== FAIL) {
        value = ${vSrc};
    }
    pos = ${posSrc};`;
            },
            peekNot(patt) {
                // for backtracking
                const posSrc = nextVar('pos');
                const vSrc = nextVar('v');
                const pattSrc = peval(patt);
                // if the pattern matches, FAIL, else restore
                // always rewind.
                return indent`
    ${posSrc} = pos;
    ${vSrc} = value;
    ${pattSrc}
    if (value !== FAIL) {
        value = FAIL;
    }
    else {
        value = ${vSrc};
    }
    pos = ${posSrc};`;
            },
        });

        function peval(sexp) {
            if (typeof sexp === 'string') {
                // We only match idents... literal strings are protected
                // by ['lit', s].
                const nameStr = JSON.stringify(sexp);
                return `[pos, value] = RUN(self, self.rule_${sexp}, pos, ${nameStr});`;
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
        const wm = makeWeakMap();
        return function (template, ...subs) {
            let quasiRest = wm.get(template);
            if (!quasiRest) {
                quasiRest = quasiCurry(template);
                wm.set(template, quasiRest);
            }
            if (typeof quasiRest !== 'function') {
                throw Error(`${typeof quasiRest}: ${quasiRest}`);
            }
            return quasiRest(...subs);
        };
    }

    function quasifyParser(Parser) {
        function baseCurry(template) {
            const parser = Parser(template);
            let pair = null;
            try {
                pair = (1, parser).start(parser);
            } finally {
                // parser.done();  // hook for logging debug output
            }
            return pair;
        }
        const quasiParser = quasiMemo(baseCurry);
        quasiParser.Parser = Parser;
        return quasiParser;
    }

    const defaultBaseGrammar = harden({Parser: {}});

    function metaCompile(baseRules, _ = void 0) {
        const baseAST = ['peg', ...baseRules];
        const parserTraitMakerSrc = compile(baseAST);
    console.log('\n\n' + parserTraitMakerSrc + '\n\n');
        const makeParserTrait = confine(parserTraitMakerSrc, {
            FAIL,
            EAT,
            ERROR,
            RUN,
        });
        return function (...baseActions) {
            const parserTrait = makeParserTrait(...baseActions);
            function _asExtending(baseQuasiParser) {
                const Parser = parserTrait(baseQuasiParser.Parser);

                const pegTag = quasifyParser(Parser);

                // These predicates are needed by our extended grammars.
                pegTag.ACCEPT = ACCEPT;
                pegTag.HOLE = HOLE;
                pegTag.FAIL = FAIL;
                pegTag.EAT = EAT;

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
    let bootPegTag;
    const actionExtractor = (_, ...actions) => actions;

    // Add our primitives.
    actionExtractor.ACCEPT = ACCEPT;
    actionExtractor.HOLE = HOLE;
    actionExtractor.FAIL = FAIL;

    const pegActions = makePeg(actionExtractor);

    // Bootstrap the compiler with the precompiled bootPegAst.
    bootPegTag = metaCompile(bootPegAst)(...pegActions);

    return harden({ bootPegTag, metaCompile });
}

export default harden(bootPeg);
