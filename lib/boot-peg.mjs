// A lot of this code is lifted from:
// https://github.com/erights/quasiParserGenerator/tree/master/src/bootbnf.js

/// <reference path="./jessie.d.ts" />
/// <reference path="./peg.d.ts" />
import indent from './indent.mjs';

/**
 * @type {PegConstant}
 */
const LEFT_RECUR = harden({toString: () => 'LEFT_RECUR'});

/**
 * @type {PegRun}
 */
function RUN(self, ruleOrPatt, pos, name) {
    if (self._debug) {
        slog.info`run(f, ${pos}, ${name})`;
    }
    let posm = self._memo.get(pos);
    if (!posm) {
        posm = makeMap();
        self._memo.set(pos, posm);
    }
    let result = posm.get(ruleOrPatt);
    if (result) {
        if (result === LEFT_RECUR) {
            throw makeError(`Left recursion on rule: ${name}`);
        }
        self._hits(1);
    } else {
        posm.set(ruleOrPatt, LEFT_RECUR);
        self._misses(1);
        if (typeof ruleOrPatt === 'function') {
            result = ruleOrPatt(self, pos);
        } else if (ruleOrPatt === void 0) {
            throw makeError(`Rule missing: ${name}`);
        } else {
            result = EAT(self, pos, ruleOrPatt);
        }
        posm.set(ruleOrPatt, result);
    }
    return result;
}

/**
 * @return {[number, string[]]}
 */
function lastFailures(self) {
    let maxPos = 0;
    let fails = [];
    for (let [pos, posm] of self._memo) {
        for (let [ruleOrPatt, result] of posm) {
            if (typeof ruleOrPatt !== 'function' && result !== LEFT_RECUR) {
                const fail = JSON.stringify('' + ruleOrPatt);
                const [newPos, v] = result;
                if (v === FAIL) {
                    if (newPos > maxPos) {
                        maxPos = newPos;
                        fails = [fail];
                    } else if (newPos === maxPos) {
                        fails.push(fail);
                    }
                }
            }
        }
    }
    return [maxPos, fails];
}

function ERROR(self, pos) {
    slog.error`
-------template--------
${JSON.stringify(self.template, void 0, ' ')}
-------`;
    const [last, fails] = lastFailures(self);
    const found = FIND(self.template, last);
    const tokStr = Array.isArray(found) ?
        `At ${last} ${makeTokStr(self, found)}` :
        `Unexpected EOF after ${makeTokStr(self, FIND(self.template, last - 1))}`;

    const failStr = fails.length === 0 ?
        `stuck` : `looking for ${fails.join(' ')}`;
    throw makeError(`Syntax error ${tokStr} ${failStr}`);
}


function makeTokStr(self, found) {
    if (Array.isArray(found)) {
        const segment = self.template[found[0]];
        return `${JSON.stringify(segment[found[1]])} #${found[0]}:${found[1]}`;
    }
    if (typeof found === 'number') {
        return `hole #${found}`;
    }
    return undefined;
}
 

function DONE(self) {
    if (self._debug) {
        for (let [pos, posm] of self._memo) {
            const fails = [];
            for (let [ruleOrPatt, result] of posm) {
                const name = typeof ruleOrPatt === 'function' ?
                    ruleOrPatt.name : JSON.stringify(ruleOrPatt);
                if (result === LEFT_RECUR) {
                    slog.error`${name}(${pos}) => left recursion detector`;
                } else {
                    const [newPos, v] = result;
                    if (v === FAIL) {
                        fails.push(name);
                    } else {
                        slog.debug`${name}(${pos}) => [${newPos}, ${v}]`;
                    }
                }
            }
            if (fails.length >= 1) {
                slog.debug`@${pos} => FAIL [${fails}]`;
            }
        }
        slog.info`hits: ${self._hits(0)}, misses: ${self._misses(0)}`;
    }
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
    // Not really needed: useful for incremental compilation.
    return [pos, []];
}

/**
 * @type {PegEat}
 */
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

/**
 * @type {PegPredicate}
 */
function HOLE(self, pos) {
    const found = FIND(self.template, pos);
    if (typeof found === 'number') {
        return [pos + 1, found];
    }
    return [pos, FAIL];
}

const FAIL = harden({toString: () => 'FAIL'});
const SKIP = harden({toString: () => 'SKIP'});

const octalDigits = "01234567";
function unescape(cs) {
    if (cs[0] !== '\\') {
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
    case '0':
        q = '\0';
        break;
    default:
        let i = 1;
        let c = octalDigits.indexOf(cs[i]);
        if (c >= 0) {
            // It's an octal escape, so consume a byte.
            let ord = c;
            if (c > 0) {
                c = octalDigits.indexOf(cs[i + 1]);
                if (c >= 0) {
                    // Two-digit octal escape.
                    i ++;
                    ord *= 8;
                    ord += c;
                    c = octalDigits.indexOf(cs[i + 1]);
                    if (c >= 0 && ord * 8 + c < 256) {
                        // Three-digit octal escape.
                        i ++;
                        ord *= 8;
                        ord += c;
                    }
                }
            }
            // We got an octal escape.
            q = String.fromCharCode(ord);
        }
        return [q, 1 + i];
    }

    return [q, 2];
}

/**
 * @template T
 * @param {(pegTag: BootPegTag<T>, metaCompile: (defs: PegDef[]) => any) => T} makePeg
 * @param {PegDefs} bootPegAst 
 */
function bootPeg(makePeg, bootPegAst) {
    function compile(sexp) {
        let numSubs = 0;              // # of holes implied by sexp, so far
        const tokenTypes = makeSet(); // Literal tokens in sexp, so far

        // generated names
        // act_${i}      action parameter
        // rule_${name}  method from peg rule
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
      let myHits = 0, myMisses = 0;
      return baseMemo => (template, debug) => {
          const BaseParser = baseMemo({});
          return {...BaseParser,
        template: template.raw,
        _memo: makeMap(),
        _hits: (i) => myHits += i,
        _misses: (i) => myMisses += i,
        _debug: debug,
        start: (self) => {
          const pair = RUN(self, self.rule_${name}, 0, ${JSON.stringify(name)});
          if (pair[1] === FAIL) {
            ERROR(self, pair[0]);
          }
          return pair[1];
        },
        done: DONE,
        ${rulesSrc}
    }};
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
      let beginPos, yytext;
      ${termsSrc}
      if (yytext !== undefined) {
          ${vSrc} = [yytext];
      }
      else {
        ${vSrc} = ${sSrc};
      }
    }
    if ((value = ${vSrc}) === FAIL) pos = ${posSrc};`;
            },
            pred(hole) {
                numSubs = Math.max(numSubs, hole + 1);
                return `[pos, value] = act_${hole}(self, pos);`;
            },
            val0(...terms) {
                // FIXME: Find a better way to specify where < foo > can
                // provide a default semantic action, and to warn
                // when it is in the wrong context.
                const termsSrc = vtable.seq(...terms);
                return indent`
    ${termsSrc}
    if (value !== FAIL) value = value.find((v) => v !== SKIP);`;
            },
            act(hole, ...terms) {
                numSubs = Math.max(numSubs, hole + 1);
                const termsSrc = vtable.seq(...terms);
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
                    JSON.stringify(`super.${ident}`)});`;
            },
            // PEG extensions.
            begin() {
                // Mark the current pos.
                return `beginPos = pos; value = [];`;
            },
            end() {
                // Use the specified beginPos to extract a string
                return indent`
    if (beginPos !== undefined) {
        yytext = '';
        while (beginPos < pos) {
            [beginPos, value] = EAT(self, beginPos);
            if (value === FAIL) {
                break;
            }
            yytext += value;
        }
        beginPos = undefined;
        value = [];
    }`;
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
                        const [c2, j2] = unescape(cs.substr(i));
                        i += j2;
                        const min = c.codePointAt(0);
                        const max = c2.codePointAt(0);
                        for (let k = min; k <= max; k++) {
                            classStr += String.fromCharCode(k);
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
            lit(cs) {
                let str = '', i = 0;
                while (i < cs.length) {
                    const [c, j] = unescape(cs.substr(i));
                    i += j;
                    str += c;
                }
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
    ${pattSrc}
    if (value !== FAIL) {
        value = [];
    }
    pos = ${posSrc};`;
            },
            peekNot(patt) {
                // for backtracking
                const posSrc = nextVar('pos');
                const pattSrc = peval(patt);
                // if the pattern matches, FAIL, else success,
                // always rewind.
                return indent`
    ${posSrc} = pos;
    ${pattSrc}
    value = (value === FAIL) ? [] : FAIL;
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
                throw makeError(`Cannot find ${sexp[0]} in vtable`);
            }
            return op(...sexp.slice(1));
        }

        return peval(sexp);
    }

    function quasiMemo(quasiCurry) {
        const wm = makeWeakMap();
        let debug = false;
        return function templateTag(template, ...subs) {
            if (template === 'DEBUG') {
                // Called as tag('DEBUG')`template string`
                // Turn on debug mode.
                debug = true;
                return templateTag;
            }
            let quasiRest = wm.get(template);
            if (!quasiRest) {
                quasiRest = quasiCurry(template, debug);
                wm.set(template, quasiRest);
            }
            if (typeof quasiRest !== 'function') {
                throw makeError(`${typeof quasiRest}: ${quasiRest}`);
            }
            return quasiRest(...subs);
        };
    }

    function quasifyParser(Parser) {
        function baseCurry(template, debug) {
            const parser = Parser(template, debug);
            let pair = null;
            try {
                pair = parser.start(parser);
            } finally {
                parser.done(parser);  // hook for logging debug output
            }
            return pair;
        }
        const quasiParser = quasiMemo(baseCurry);
        return Object.assign(quasiParser, {Parser: bond(Parser)});
    }

    const defaultBaseGrammar = quasifyParser(template => {});

    function metaCompile(baseRules) {
        const baseAST = ['peg', ...baseRules];
        const parserTraitMakerSrc = compile(baseAST);
        //slog.trace`SOURCES: ${parserTraitMakerSrc}\n`;
        const makeParserTrait = confine(parserTraitMakerSrc, {
            DONE,
            FAIL,
            EAT,
            ERROR,
            RUN,
            SKIP,
        });

        return function(...baseActions) {
            const parserTrait = makeParserTrait(...baseActions);
            const _asExtending = (baseQuasiParser) => {
                const Parser = parserTrait(baseQuasiParser.Parser);
                const pegTag = quasifyParser(Parser);

                // These predicates are needed by our extended grammars.
                return Object.assign(pegTag, {ACCEPT, HOLE, FAIL, EAT, SKIP});
            };
            const quasiParser = _asExtending(defaultBaseGrammar);
            return Object.assign(quasiParser, {
                _asExtending,
                extends: (baseQuasiParser) =>
                    (template, ...subs) =>
                        quasiParser(template, ...subs)._asExtending(baseQuasiParser),
            })
        }
    }

    // Bootstrap the compiler with the precompiled pegAst.
    /**
     * @type {BootPegTag}
     */
    const actionExtractorTag = Object.assign(
        (_template, ...actions) => actions,
        {ACCEPT, HOLE});

    // Extract the actions, binding them to the metaCompile function.
    const bootPegActions = makePeg(actionExtractorTag, metaCompile);

    // Create the parser tag from the AST and the actions.
    const bootPegTag = metaCompile(bootPegAst)(...bootPegActions);

    // Use the parser tag to create another parser tag that returns the AST.
    const astExtractorTag = makePeg(bootPegTag, (defs) => (..._) => defs);
    const reparsedPegAst = makePeg(astExtractorTag, undefined);

    // Compare our bootPegTag output to bootPegAst, to help ensure it is
    // correct.  This doesn't defend against a malicious bootPeg,
    // but it does prevent silly mistakes.
    const a = JSON.stringify(bootPegAst, undefined, '  ');
    const b = JSON.stringify(reparsedPegAst, undefined, '  ');
    if (a !== b) {
        slog.info`=== reparsedPegAst
${b}
`;
        throw makeError(`FATAL: reparsedPegAst does not match src/boot-pegast.ts`);
    }

    // Use the metaCompiler to generate another parser.
    /**
     * @type {PegTag}
     */
    const pegTag = makePeg(bootPegTag, metaCompile);

    // YAAY!  If you got this far, you can uncomment the following
    // and overwrite src/boot-pegast.ts.
    //throw("// boot-pegast.ts - AUTOMATICALLY GENERATED by boot-env.ts\nexport default harden(" + b + ");\n");
    return harden(pegTag);
}

export default harden(bootPeg);
