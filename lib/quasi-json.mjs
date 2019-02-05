// Subsets of JavaScript, starting from the grammar as defined at
// http://www.ecma-international.org/ecma-262/9.0/#sec-grammar-summary

// Defined to be extended into the Jessie grammar.
// See https://github.com/Agoric/Jessie/blob/master/README.md
// for documentation of the Jessie grammar.

// See also json.org

function makeJSON(pegPeg) {
    const peg = pegPeg;
    const FAIL = peg.FAIL;
    return peg`
# to be overridden or inherited
start <- assignExpr EOF                   ${(v,_) => (..._) => v};

# to be extended
primaryExpr <-
  dataLiteral                             ${n => ['data',JSON.parse(n)]}
/ array
/ record
/ HOLE                                    ${h => ['exprHole',h]};

dataLiteral <-  "null" / "false" / "true" / number / string;

array <-
  "[" ws "]"                              ${(_,_2,_3) => ['array']}
/ "[" element ** "," "]"                  ${(_,es,_2) => ['array',es]};

# to be extended
element <- ws assignExpr ws;

# The JavaScript and JSON grammars calls records "objects"
record <- "{" ws "}"                      ${(_,_2,_3) => ['record']}
/ "{" (propDef ** "," ) "}"               ${(_,ps,_2) => ['record', ps]};

# to be extended
propDef <- propName ":" assignExpr        ${(k,_,e) => ['prop',k,e]};

# to be extended
propName <- ws string ws                  ${(_,str,_2) => {
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

string <- < '"' (~'"' character)* '"' >
/ < "'" (~"'" character)* "'" >;

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

hex <- digit / [a-fA-F];

number <- < int frac? exp? >;

int <- digit
/ [1-9] digit+
/ '-' digit
/ '-' [1-9] digit+;

digit <- [0-9];

frac <- '.' digit+;
exp <- [Ee] [+\-]? digit+;

ws <- [\11\12\15\40]*;
`;

}


export default harden(makeJSON);
