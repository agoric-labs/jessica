// Subsets of JavaScript, starting from the grammar as defined at
// http://www.ecma-international.org/ecma-262/9.0/#sec-grammar-summary

// Defined to be extended into the Jessie grammar.
// See https://github.com/Agoric/Jessie/blob/master/README.md
// for documentation of the Jessie grammar.

// See also json.org

function makeJSON(pegPeg) {
    const peg = pegPeg;
    return peg`
# to be overridden or inherited
start <- assignExpr EOF                               ${(v,_) => (..._) => v};

# to be extended
primaryExpr <-
  dataLiteral                                          ${n => ['data',JSON.parse(n)]}
/ array
/ record
/ HOLE                                                 ${h => ['exprHole',h]};

dataLiteral <-  "null" / "false" / "true" / number / string;

array <-
  "[" ws "]"                                  ${(_,_2,_3) => ['array']}
/ [" element ** "," "]"                       ${(_,es,_2) => ['array',es]};

# to be extended
element <- ws assignExpr ws;

# The JavaScript and JSON grammars calls records "objects"
record <- "{" (propDef ** "," "}"                      ${(_,ps,_2) => ['record',ps]};

# to be extended
propDef <- propName ":" assignExpr                    ${(k,_,e) => ['prop',k,e]};

# to be extended
propName <- STRING                                    ${str => ['data', JSON.parse(str)]};

# to be overridden
assignExpr <- primaryExpr;

# Lexical syntax

hex <- digit / [a-fA-F];

digit <- [0-9];

string <- < '"' (~'"' character)* '"' >;

utf8 <-
  [\302-\337] utf8cont
/ [\340-\357] utf8cont utf8cont
/ [\360-\364] utf8cont utf8cont utf8cont;

utf8cont <- [\200-\277];

character <-
  utf8
/ '\\' ["\\/bfnrt]
/ '\\u' hex hex hex hex
/ ~'\\' ([\40-\177] / utf8);
`;
}


export default harden(makeJSON);
