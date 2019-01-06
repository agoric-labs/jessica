function simple(prefix, list) {
    if (list.length === 0) { return ['empty']; }
    if (list.length === 1) { return list[0]; }
    return [prefix, ...list];
}

function makePeg(pegPeg, metaCompile) {
    const peg = pegPeg;
    const {ACCEPT, BEGIN, END, HOLE} = peg;

    return peg`
# PEG quasi Grammar for PEG quasi Grammars
# Michael FIG <michael+jessica@fig.org>, 2019-01-05
#
# This grammar is adapted from:
# http://piumarta.com/software/peg/peg-0.1.18/src/peg.peg
#
# Modified for Jessica to support:
#   Semantic actions provided in tagged template HOLEs
#   '~' for negative lookahead (instead of '!')
#   ';' terminator for definitions
#   '**' and '++' for separators
#   'super.RULE' syntax for extended grammars
# which are adapted from:
# https://github.com/erights/quasiParserGenerator

# Hierarchical syntax

Grammar      <- Spacing Definition+ EndOfFile
                    ${(_, defs, _2) => metaCompile(defs)};

Definition   <- Identifier LEFTARROW Expression SEMI &${ACCEPT}
                    ${(i,_,e,_2) => ['def', i, e]};
Expression   <- Sequence ** SLASH
                    ${list => simple('or', list)};
Sequence     <- Prefix ** ''
                    ${list => simple('seq', list)};
Prefix       <- AND Action
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
                    ${(patt, q) => [q, patt]}
              / Primary;
Primary      <- Super
                    ${(i) => ['super', i]}
              / Identifier ~LEFTARROW
              / OPEN Expression CLOSE
              / Literal
                    ${(s) => ['lit', s]}
              / Class
                    ${(c) => ['cls', c]}
              / DOT
                    ${() => ['dot']}
              / Action
                    ${(a) => ['act', a]}
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

Action       <- &${HOLE} Spacing;
Super        <- 'super.' < Identifier >;
BEGIN        <- '<' Spacing;
END          <- '>' Spacing;
PLUSPLUS     <- '++' Spacing;
STARSTAR     <- '**' Spacing;
`;
}

export default harden(makePeg);
