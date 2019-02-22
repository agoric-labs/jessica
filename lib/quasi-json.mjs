// Subsets of JavaScript, starting from the grammar as defined at
// http://www.ecma-international.org/ecma-262/9.0/#sec-grammar-summary

// Defined to be extended into the Jessie grammar.
// See https://github.com/Agoric/Jessie/blob/master/README.md
// for documentation of the Jessie grammar.

// See also json.org

/// <reference path="./jessie.d.ts"/>
/// <reference path="./peg.d.ts"/>

/**
 * @param {PegTag} pegPeg 
 * @return {PegTag}
 */
function makeJSON(pegPeg) {
    const peg = pegPeg;
    const {FAIL, HOLE, SKIP} = peg;
    return peg`
# to be overridden or inherited
start <- WS assignExpr EOF                ${(_,v,_2) => (..._) => v};

# to be extended
primaryExpr <- dataStructure;

dataStructure <-
  dataLiteral                             ${n => ['data',JSON.parse(n)]}
/ array
/ record
/ HOLE                                    ${h => ['exprHole',h]};

dataLiteral <- ("null" / "false" / "true" / NUMBER / STRING) WS;

array <-
  LEFT_BRACKET RIGHT_BRACKET                              ${(_,_2) => ['array']}
/ LEFT_BRACKET (element ** COMMA) RIGHT_BRACKET             ${(_,es,_2) => ['array',es]};

# to be extended
element <- assignExpr;

# The JavaScript and JSON grammars calls records "objects"

record <- LEFT_BRACE RIGHT_BRACE           ${(_,_2) => ['record']}
/ LEFT_BRACE propDef ** COMMA RIGHT_BRACE  ${(_,ps,_2) => ['record', ps]};

# to be extended
propDef <- propName COLON assignExpr        ${(k,_,e) => ['prop',k,e]};

# to be extended
propName <- STRING                     ${(str) => {
                                            const js = JSON.parse(str);
                                            if (js === '__proto__') {
                                              // Don't allow __proto__ behaviour attacks.
                                              return FAIL;
                                            }
                                            return ['data', JSON.parse(str)];
                                          }};

# to be overridden
assignExpr <- primaryExpr;

# Lexical syntax

EOF <- ~.;
LEFT_BRACKET <- "[" WS;
RIGHT_BRACKET <- "]" WS;
LEFT_BRACE <- "{" WS;
RIGHT_BRACE <- "}" WS;
COMMA <- "," WS;
COLON <- ":" WS;
HOLE <- &${HOLE} WS;

STRING <- < '"' (~'"' character)* '"' > WS;

utf8 <-
  [\302-\337] utf8cont
/ [\340-\357] utf8cont utf8cont
/ [\360-\364] utf8cont utf8cont utf8cont;

utf8cont <- [\200-\277];

character <-
  escape
/ '\\u' hex hex hex hex
/ ~'\\' ([\40-\177] / utf8);

escape <- '\\' ["\\/bfnrt];
hex <- digit / [a-fA-F];

NUMBER <- < int frac? exp? > WS;

int <- [1-9] digit+
/ digit
/ '-' digit
/ '-' [1-9] digit+;

digit <- [0-9];

frac <- '.' digit+;
exp <- [Ee] [+\-]? digit+;

WS <- [\t\n\r ]*     ${(_) => SKIP};
`;

}


export default harden(makeJSON);
