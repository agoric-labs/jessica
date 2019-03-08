// A lot of this code is lifted from:
// https://github.com/erights/quasiParserGenerator/tree/master/src/bootbnf.js

import indent from './indent.mjs';
import './peg.mjs';

const LEFT_RECUR: PegConstant = harden({toString: () => 'LEFT_RECUR'});

function RUN(self: IPegParser, ruleOrPatt: PegRuleOrPatt, pos: number, name: string) {
    if (self._debug) {
        slog.info`run(f, ${pos}, ${name})`;
    }
    let posm = self._memo.get(pos);
    if (!posm) {
        posm = makeMap<PegRuleOrPatt, any>();
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
            result = EAT(self, pos, ruleOrPatt as PegExpr);
        }
        posm.set(ruleOrPatt, result);
    }
    return result;
}

function lastFailures(self: IPegParser): [number, string[]] {
    let maxPos = 0;
    let fails: string[] = [];
    for (const [pos, posm] of self._memo) {
        for (const [ruleOrPatt, result] of posm) {
            if (result !== LEFT_RECUR) {
                const fail = typeof ruleOrPatt === 'function' ?
                    ruleOrPatt.name.slice(5) :
                    JSON.stringify('' + ruleOrPatt);
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

function ERROR(self: IPegParser, pos: number) {
    const [last, fails] = lastFailures(self);
    const found = FIND(self.template, last);
    const tokStr = Array.isArray(found) ?
        `at ${last} ${makeTokStr(self, found)}` :
        `unexpected EOF after ${makeTokStr(self, FIND(self.template, last - 1))}`;

    const failStr = fails.length === 0 ?
        `stuck` : `looking for ${fails.join(', ')}`;
    const {sources} = self.template;
    throw makeError(`Syntax error ${tokStr} ${failStr}
    -------template--------
    ${self.template.raw.reduce((prior, r, i) => {
        if (sources) {
            const s = sources[i];
            prior += `    ${s.uri}:${s.line}: `;
        }
        prior += JSON.stringify(r) + '\n';
        return prior;
    }, '')}
    -------`);
}

function makeTokStr(self: IPegParser, found: [number, number] | number) {
    if (Array.isArray(found)) {
        const segment = self.template[found[0]];
        return `${JSON.stringify(segment[found[1]])} #${found[0]}:${found[1]}`;
    }
    if (typeof found === 'number') {
        return `hole #${found}`;
    }
    return undefined;
}

function DONE(self: IPegParser) {
    if (self._debug) {
        for (const [pos, posm] of self._memo) {
            const fails = [];
            for (const [ruleOrPatt, result] of posm) {
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

function FIND(template: TemplateStringsArray, pos: number):
    [number, number] | number | undefined {
    const {raw} = template;
    const numSubs = raw.length - 1;
    let relpos = pos;
    for (let segnum = 0; segnum <= numSubs; segnum++) {
        const segment = raw[segnum];
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

const ACCEPT: PegPredicate = (self, pos) => {
    // Not really needed: useful for incremental compilation.
    return [pos, []];
};

const EAT: PegEat = (self, pos, str) => {
    // if (self._debug) {
    //    slog.error`Have ${self.template}`;
    // }
    const found = FIND(self.template, pos);
    if (Array.isArray(found)) {
        const segment = self.template.raw[found[0]];
        if (typeof str === 'string') {
            if (segment.startsWith(str, found[1])) {
                return [pos + str.length, str];
            }
        } else {
            // Just return the next character.
            return [pos + 1, segment[found[1]]];
        }
    }
    return [pos, FAIL];
};

const HOLE: PegPredicate = (self, pos) => {
    const found = FIND(self.template, pos);
    if (typeof found === 'number') {
        return [pos + 1, found];
    }
    return [pos, FAIL];
};

const FAIL = harden({toString: () => 'FAIL'});
const SKIP = harden({toString: () => 'SKIP'});

const octalDigits = '01234567';
function unescape(cs: string): [string, number] {
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

function bootPeg<T>(makePeg: MakePeg, bootPegAst: PegDef[]) {
    function compile(sexp: PegExpr) {
        let numSubs = 0;              // # of holes implied by sexp, so far

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
        function nextVar(prefix: string) {
            const result = `${prefix}_${alphaCount++}`;
            vars.push(result);
            return result;
        }
        function takeVarsSrc() {
            const result = `${vars.join(', ')};`;
            vars.length = 1;
            return result;
        }
        function nextLabel(prefix: string) {
            return `${prefix}_${alphaCount++}`;
        }

        const vtable: {[index: string]: (...args: any[]) => string} = harden({
            peg(...rules: PegDef[]) {
                // The following line also initializes numSubs
                const rulesSrc = rules.map(peval).join('\n');

                const paramSrcs = [];
                for (let i = 0; i < numSubs; i++) {
                    paramSrcs.push(`act_${i}`);
                }
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
        template,
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
            def(name: string, body: PegExpr) {
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
            or(...choices: PegExpr[]) {
                const labelSrc = nextLabel('or');
                const choicesSrc = choices.map(peval).map(cSrc => indent`
    ${cSrc}
    if (value !== FAIL) break ${labelSrc};`).join('\n');

                return indent`
    ${labelSrc}: {
      ${choicesSrc}
    }`;
            },
            seq(...terms: PegExpr[]) {
                const posSrc = nextVar('pos');
                const labelSrc = nextLabel('seq');
                const sSrc = nextVar('s');
                const vSrc = nextVar('v');
                const termsSrc = terms.map(peval).map(termSrc => indent`
    ${termSrc}
    if (value === FAIL) break ${labelSrc};
    if (value !== SKIP) ${sSrc}.push(value);`).join('\n');

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
            pred(hole: number) {
                numSubs = Math.max(numSubs, hole + 1);
                return `[pos, value] = act_${hole}(self, pos);`;
            },
            val0(...terms: PegExpr[]) {
                // FIXME: Find a better way to specify where < foo > can
                // provide a default semantic action, and to warn
                // when it is in the wrong context.
                const termsSrc = vtable.seq(...terms);
                return indent`
    ${termsSrc}
    if (value !== FAIL && value.length === 1) value = value[0];`;
            },
            act(hole: number, ...terms: PegExpr[]) {
                numSubs = Math.max(numSubs, hole + 1);
                const termsSrc = vtable.seq(...terms);
                return indent`
    ${termsSrc}
    if (value !== FAIL) value = act_${hole}(...value);`;
            },
            '**'(patt: PegExpr, sep: PegExpr) {
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
      if (value !== SKIP) ${sSrc}.push(value);
      ${posSrc} = pos;
      ${sepSrc}
      if (value === FAIL) break;
      if (pos === ${startSrc}) break;
    }
    value = ${sSrc};`;
            },
            '++'(patt: PegExpr, sep: PegExpr) {
                const starSrc = vtable['**'](patt, sep);
                return indent`
    ${starSrc}
    if (value.length === 0) value = FAIL;`;
            },
            '?'(patt: PegExpr) {
                return vtable['**'](patt, ['fail']);
            },
            '*'(patt: PegExpr) {
                return vtable['**'](patt, ['empty']);
            },
            '+'(patt: PegExpr) {
                return vtable['++'](patt, ['empty']);
            },
            super(ident: string) {
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
            cls(cs: string) {
                // Character class.
                let classStr = '', i = 0;
                const invert = (cs[i] === '^');
                if (invert) {
                    ++i;
                }
                while (i < cs.length) {
                    const [c, j] = unescape(cs.slice(i));
                    i += j;
                    if (cs[i] === '-') {
                        // It's a range.
                        ++i;
                        const [c2, j2] = unescape(cs.slice(i));
                        i += j2;
                        const min = c.charCodeAt(0);
                        const max = c2.charCodeAt(0);
                        for (let k = min; k <= max; k++) {
                            classStr += String.fromCharCode(k);
                        }
                    } else {
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
            lit(cs: string) {
                let str = '', i = 0;
                while (i < cs.length) {
                    const [c, j] = unescape(cs.slice(i));
                    i += j;
                    str += c;
                }
                return indent`
    [pos, value] = EAT(self, pos, ${JSON.stringify(str)});
    `;
            },
            peek(patt: PegExpr) {
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
        value = SKIP;
    }
    pos = ${posSrc};`;
            },
            peekNot(patt: PegExpr) {
                // for backtracking
                const posSrc = nextVar('pos');
                const pattSrc = peval(patt);
                // if the pattern matches, FAIL, else success,
                // always rewind.
                return indent`
    ${posSrc} = pos;
    ${pattSrc}
    value = (value === FAIL) ? SKIP : FAIL;
    pos = ${posSrc};`;
            },
        });

        function peval(expr: PegExpr): string {
            if (typeof expr === 'string') {
                // We only match idents... literal strings are protected
                // by ['lit', s].
                const nameStr = JSON.stringify(expr);
                return `[pos, value] = RUN(self, self.rule_${expr}, pos, ${nameStr});`;
            }
            const op = vtable[expr[0]];
            if (!op) {
                throw makeError(`Cannot find ${expr[0]} in vtable`);
            }
            return op(...expr.slice(1));
        }

        return peval(sexp);
    }

    type InitPegTag<V> = IFlaggedTag<IPegTag<V>, V>;
    type FlagTemplate = TemplateStringsArray | string;

    function quasiMemo<V>(quasiCurry: (template: TemplateStringsArray, debug: boolean) => IPegTag<T>,
                          parserCreator: IPegParserTag['parserCreator']) {
        const wm = makeWeakMap();
        let debug = false;
        const templateTag =             (templateOrFlag: FlagTemplate, ...subs: any[]) => {
            if (typeof templateOrFlag === 'string') {
                switch (templateOrFlag) {
                case 'DEBUG':
                    // Called as tag('DEBUG')`template string`
                    // Turn on debug mode.
                    debug = true;
                    break;
                default:
                    throw makeError(`Unrecognized tag flag ${{templateOrFlag}}`);
                }
                return templateTag;
            }
            const template = templateOrFlag;
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
        return Object.assign(templateTag, {parserCreator});
    }

    function quasifyParser<V>(parserCreator: PegParserCreator) {
        function baseCurry(template: TemplateStringsArray, debug: boolean) {
            const parser = parserCreator(template, debug);
            if (parser === undefined) {
                throw makeError('Cannot curry baseParserCreator');
            }
            let pair = null;
            try {
                pair = parser.start(parser);
            } finally {
                parser.done(parser);  // hook for logging debug output
            }
            return pair;
        }
        return quasiMemo<V>(baseCurry, bond(parserCreator));
    }

    const defaultBaseGrammar = quasifyParser(_template => undefined);

    function metaCompile(baseRules: PegDef[]) {
        const baseAST = ['peg', ...baseRules];
        const parserTraitMakerSrc = compile(baseAST);
        // slog.trace`SOURCES: ${parserTraitMakerSrc}\n`;
        type ParserTrait = (base: PegParserCreator) => PegParserCreator;
        const makeParserTrait = confine<(...actions: any[]) => ParserTrait>(parserTraitMakerSrc, {
            DONE,
            EAT,
            ERROR,
            FAIL,
            RUN,
            SKIP,
        });

        return function parserTag(...baseActions: any[]) {
            const parserTrait = makeParserTrait(...baseActions);
            const _asExtending = <V, W>(baseQuasiParser: IPegParserTag<V>): IPegTag<W> => {
                const parserCreator = parserTrait(baseQuasiParser.parserCreator);
                return Object.assign(quasifyParser<V>(parserCreator), {
                    ACCEPT,
                    EAT,
                    FAIL,
                    HOLE,
                    SKIP,
                    _asExtending,
                    extends: ext,
                });
            };
            const quasiParser = _asExtending<T, IPegTag<T>>(defaultBaseGrammar);
            const ext = <V, W>(baseQuasiParser: IPegParserTag): IPegTag<W> | W => {
                const makeTag: InitPegTag<V> =
                    (templateOrFlag: string | TemplateStringsArray, ...substs: PegHole[]) => {
                        const flags: string[] = [];

                        const tag: IPegTag<W> = Object.assign(
                            (tmplOrFlag: string | TemplateStringsArray, ...subs: PegHole[]) => {
                                if (typeof tmplOrFlag === 'string') {
                                    flags.push(tmplOrFlag);
                                    return tag;
                                }
                                const parserBase = quasiParser(tmplOrFlag, ...subs)._asExtending<V>(baseQuasiParser);
                                const parser = flags.reduce<IPegTag<V>>((p, flag) => p(flag), parserBase);
                                return parser;
                            },
                            {
                                ACCEPT,
                                EAT,
                                FAIL,
                                HOLE,
                                SKIP,
                                _asExtending,
                                extends: ext,
                                parserCreator: baseQuasiParser.parserCreator,
                            });

                        if (typeof templateOrFlag === 'string') {
                            return tag(templateOrFlag);
                        }
                        return tag(templateOrFlag, ...substs);
                    };
                return Object.assign((templateOrFlag: string | TemplateStringsArray, ...subs: PegHole[]) => {
                        if (typeof templateOrFlag === 'string') {
                            return makeTag(templateOrFlag);
                        }
                        return makeTag(templateOrFlag, ...subs);
                    },
                    {
                        ACCEPT,
                        EAT,
                        FAIL,
                        HOLE,
                        SKIP,
                        _asExtending,
                        extends: ext,
                        parserCreator: baseQuasiParser.parserCreator,
                    });
            };
            quasiParser.extends = ext;
            return quasiParser;
        };
    }

    // Bootstrap the compiler with the precompiled pegAst.
    const actionExtractorTag = (_template: TemplateStringsArray, ...actions: any[]) => actions;
    actionExtractorTag.ACCEPT = ACCEPT;
    actionExtractorTag.HOLE = HOLE;
    actionExtractorTag.SKIP = SKIP;

    // Extract the actions, binding them to the metaCompile function.
    const bootPegActions = makePeg<any[], IPegTag<any>>(actionExtractorTag, metaCompile);

    // Create the parser tag from the AST and the actions.
    const bootPegTag = metaCompile(bootPegAst)(...bootPegActions);

    // Use the parser tag to create another parser tag that returns the AST.
    const astExtractorTag = makePeg<IPegTag<any>, PegDef[]>(
        bootPegTag, (defs: PegDef[]) => (..._: any[]) => defs);
    const reparsedPegAst = makePeg<IBootPegTag<PegDef[]>>(astExtractorTag, undefined);

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
    const finalPegTag = makePeg<IPegTag<T>, IPegTag<IPegTag<T>>>(bootPegTag, metaCompile);

    // YAAY!  If you got this far, you can uncomment the following
    // and overwrite src/boot-pegast.mjs.
    // throw("// boot-pegast.mjs - AUTOMATICALLY GENERATED by boot-env.mjs\nexport default harden(" + b + ");\n");
    return harden(finalPegTag);
}

export default harden(bootPeg);
