// Subsets of JavaScript, starting from the grammar as defined at
// http://www.ecma-international.org/ecma-262/9.0/#sec-grammar-summary

// Defined to be extended into the Jessie grammar.
// See https://github.com/Agoric/Jessie/blob/master/README.md
// for documentation of the Jessie grammar.

// See also json.org

/// <reference path="peg.d.ts"/>

function makeJSON(pegPeg: IPegTag) {
    const peg = pegPeg;
    const {FAIL, HOLE, SKIP} = peg;
    return peg`
# to be overridden or inherited
start <- _WS assignExpr _EOF                ${v => (..._a: any[]) => v};

# to be extended
primaryExpr <- dataStructure;

dataStructure <-
  dataLiteral                             ${n => ['data', JSON.parse(n)]}
/ array
/ record
/ HOLE                                    ${h => ['exprHole', h]};

dataLiteral <- ("null" / "false" / "true" / NUMBER / STRING) _WS;

array <-
  LEFT_BRACKET element ** COMMA RIGHT_BRACKET ${(_, es, _2) => ['array', es]};

# to be extended
element <- assignExpr;

# The JavaScript and JSON grammars calls records "objects"

record <-
  LEFT_BRACE propDef ** COMMA RIGHT_BRACE  ${(_, ps, _2) => ['record', ps]};

# to be extended
propDef <- propName COLON assignExpr       ${(k, _, e) => ['prop', k, e]};

# to be extended
propName <- STRING                     ${(str) => {
                                            const js = JSON.parse(str);
                                            if (js === '__proto__') {
                                              // Don't allow __proto__ behaviour attacks.
                                              return FAIL;
                                            }
                                            return ['data', js];
                                          }};

# to be overridden
assignExpr <- primaryExpr;

# Lexical syntax

_EOF <- ~.;
LEFT_BRACKET <- "[" _WS;
RIGHT_BRACKET <- "]" _WS;
LEFT_BRACE <- "{" _WS;
RIGHT_BRACE <- "}" _WS;
COMMA <- "," _WS;
COLON <- ":" _WS;
MINUS <- "-" _WS;
HOLE <- &${HOLE} _WS;

STRING <- < '"' (~'"' character)* '"' > _WS;

utf8 <-
  [\302-\337] utf8cont
/ [\340-\357] utf8cont utf8cont
/ [\360-\364] utf8cont utf8cont utf8cont;

utf8cont <- [\200-\277];

character <-
  escape
/ '\\u' hex hex hex hex
/ ~'\\' ([\40-\177] / utf8);

escape <- '\\' ['"\\bfnrt];
hex <- digit / [a-fA-F];

NUMBER <- < int frac? exp? > _WS;

int <- [1-9] digit+
/ digit
/ MINUS digit
/ MINUS [1-9] digit+;

digit <- [0-9];

frac <- '.' digit+;
exp <- [Ee] [+\-]? digit+;

_WS <- ([\t\n\r ]+ _WS)?   ${_ => SKIP};
`;

}

export default harden(makeJSON);
