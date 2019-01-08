// PEG quasi Grammar for PEG quasi Grammars
// Michael FIG <michael+jessica@fig.org>, 2019-01-05
//
// This grammar is adapted from:
// http://piumarta.com/software/peg/peg-0.1.18/src/peg.peg
//
// Modified for Jessica to support:
//   Semantic actions provided in tagged template HOLEs
//   '~' for negative lookahead (instead of '!')
//   ';' terminator for definitions
//   '**' and '++' for separators
//   'super.RULE' syntax for extended grammars
// which are adapted from:
// https://github.com/erights/quasiParserGenerator

function makePeg(pegPeg, metaCompile) {
      const peg = pegPeg;
      const {ACCEPT, HOLE} = peg;

      function simple(prefix, list) {
            if (list.length === 0) { return ['empty']; }
            if (list.length === 1) { return list[0]; }
            return [prefix, ...list];
      }

      function flatArgs(args) {
            return args.reduce((prior, a) => {
                  prior.push(...flatSeq(a));
                  return prior;
            }, []);
      }

      function flatSeq(term) {
            if (Array.isArray(term)) {
                  if (term.length === 0) {
                        return [];
                  }
                  const [kind, ...terms] = term;
                  if (kind === 'seq') {
                        return flatArgs(terms);
                  }
                  else if (terms.length === 0 && Array.isArray(kind)) {
                        return flatSeq(kind);
                  }
                  else {
                        return [[kind, ...flatArgs(terms)]];
                  }
            }
            
            return [term];
      }

      return peg`
# Hierarchical syntax

Grammar      <- Spacing Definition+ EndOfFile
                    ${(_, defs, _2) => metaCompile(defs) };

Definition   <- Identifier LEFTARROW Expression SEMI &${ACCEPT}
                    ${(i,_,e,_2) => ['def', i, e]};
Expression   <- Sequence ** SLASH
                    ${list => simple('or', list)};
Sequence     <- (Prefix*
                    ${list => simple('seq', list)})
                 HOLE?
                    ${(seq, optHole) => optHole.length === 0 ?
                        ['defaultAct', ...flatSeq(seq)] :
                        ['act', optHole[0], ...flatSeq(seq)]};
Prefix       <- AND HOLE
                    ${(_, a) => ['pred', a]}
              / AND Suffix
                    ${(_, s) => ['peek', s]}
              / NOT Suffix
                    ${(_, s) => ['peekNot', s]}
              /     Suffix;
Suffix       <- Primary (STARSTAR
                        / PLUSPLUS) Primary
                    ${(patt, q, sep) => [q, patt, sep]}
              / Primary (QUESTION
                        / STAR
                        / PLUS)
                    ${(patt, optQ) => [optQ[0], patt]}
              / Primary;
Primary      <- Super
              / Identifier ~LEFTARROW
              / OPEN Expression CLOSE
                    ${(_, e, _2) => e}
              / Literal
                    ${(s) => ['lit', s]}
              / Class
                    ${(c) => ['cls', c]}
              / DOT
                    ${() => ['dot']}
              / BEGIN
                    ${() => ['begin']}
              / END
                    ${() => ['end']}
              ;

# Lexical syntax

Identifier   <- < IdentStart IdentCont* > Spacing;
IdentStart   <- [a-zA-Z_];
IdentCont    <- IdentStart / [0-9];
Literal      <- ['] < (~['] Char )* > ['] Spacing
              / ["] < (~["] Char )* > ["] Spacing;
Class        <- '[' < (~']' Range)* > ']' Spacing;
Range        <- Char '-' Char / Char;
Char         <- '\\' [abefnrtv'"\[\]\\]
              / '\\' [0-3][0-7][0-7]
              / '\\' [0-7][0-7]?
              / '\\' '-'
              / ~'\\' .;
LEFTARROW    <- '<-' Spacing;
SLASH        <- '/' Spacing;
SEMI         <- ';' Spacing;
AND          <- '&' Spacing;
NOT          <- '~' Spacing;
QUESTION     <- '?' Spacing;
STAR         <- '*' Spacing;
PLUS         <- '+' Spacing;
OPEN         <- '(' Spacing;
CLOSE        <- ')' Spacing;
DOT          <- '.' Spacing;
Spacing      <- (Space / Comment)*;
Comment      <- '#' (~EndOfLine .)* EndOfLine;
Space        <- ' ' / '\t' / EndOfLine;
EndOfLine    <- '\r\n' / '\n' / '\r';
EndOfFile    <- ~.;

HOLE         <- &${HOLE} Spacing;
Super        <- 'super.' < Identifier >;
BEGIN        <- '<' Spacing;
END          <- '>' Spacing;
PLUSPLUS     <- '++' Spacing;
STARSTAR     <- '**' Spacing;
`;
}

export default harden(makePeg);
