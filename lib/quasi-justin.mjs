// Subsets of JavaScript, starting from the grammar as defined at
// http://www.ecma-international.org/ecma-262/9.0/#sec-grammar-summary
// Justin is the safe JavaScript expression language, a potentially
// pure decidable superset of JSON and subset of Jessie, that relieves
// many of the pain points of using JSON as a data format:
//   * unquoted indentifier property names.
//   * comments.
//   * multi-line strings (via template literals).
//   * undefined.
//   * includes all floating point values: NaN, Infinity, -Infinity
//   * will include BigInt once available.
// Justin also includes most pure JavaScript expressions. Justin does not
// include function expressions or variable or function
// definitions. However, it does include free variable uses and
// function calls; so the purity and decidability of Justin depends on
// the endowments provided for these free variable bindings.
// Justin is defined to be extended into the Jessie grammar, which is
// defined to be extended into the JavaScript grammar.
// See https://github.com/Agoric/Jessie/blob/master/README.md
// for documentation of the Jessie grammar.
// Justin is defined to be extended into the Chainmail grammar, to
// provide its expression language in a JS-like style. Chainmail
// expressions need to be pure and should be decidable.
import './peg.mjs';
import quasiUtils from './quasi-utils.mjs';
const { qunpack } = quasiUtils;
function binary(left, rights) {
    return rights.reduce((prev, [op, right]) => [op, prev, right], left);
}
function makeJustin(peg, jsonPeg) {
    const { FAIL, SKIP } = peg;
    return peg.extends(jsonPeg) `
    # to be overridden or inherited
    start <- WS assignExpr EOF                       ${(_, v, _2) => (..._a) => v};

    # A.1 Lexical Grammar

    DOT <- "." WS;
    ELLIPSIS <- "..." WS;
    LEFT_PAREN <- "(" WS;
    QUESTION <- "?" WS;
    RIGHT_PAREN <- ")" WS;
    STARSTAR <- "**" WS;

    # Define Javascript-style comments.
    WS <- (EOL_COMMENT / MULTILINE_COMMENT / super.WS) ${(_) => SKIP};
    EOL_COMMENT <- "//" (~[\n\r] .)* WS;
    MULTILINE_COMMENT <- "/*" (~"*/" .)* "*/" WS;

    # Add single-quoted strings.
    STRING <- super.STRING
    / "'" < (~"'" character)* > "'" WS  ${FAIL};

    # Only match if whitespace doesn't contain newline
    NO_NEWLINE <- (~[\r\n] .)+;

    IDENT_NAME <- < IDENT / RESERVED_WORD > WS;

    IDENT <- < [A-Za-z_] [A-Za-z0-9_]* > WS;

    # Omit "async", "arguments", "eval", "get", and "set" from IDENT
    # in Justin even though ES2017 considers them in IDENT.
    RESERVED_WORD <-
      (KEYWORD / RESERVED_KEYWORD / FUTURE_RESERVED_WORD
    / "null" / "false" / "true"
    / "async" / "arguments" / "eval" / "get" / "set") WS;

    KEYWORD <-
      ("break"
    / "case" / "catch" / "const" / "continue"
    / "debugger" / "default"
    / "else" / "export"
    / "finally" / "for" / "function"
    / "if" / "import"
    / "return"
    / "switch"
    / "throw" / "try" / "typeof"
    / "void"
    / "while") WS;

    # Unused by Justin but enumerated here, in order to omit them
    # from the IDENT token.
    RESERVED_KEYWORD <-
      ("class"
    / "delete" / "do"
    / "extends"
    / "in" / "instanceof"
    / "new"
    / "super"
    / "this"
    / "var"
    / "with"
    / "yield") WS;

    FUTURE_RESERVED_WORD <-
      ("await" / "enum"
    / "implements" / "package" / "protected"
    / "interface" / "private" / "public") WS;

    # Quasiliterals aka template literals
    QUASI_ALL <- < "\`" (~"\${" .)* "\`" > WS;
    QUASI_HEAD <- < "\`" (~"\${" .)* "\${" >;
    QUASI_MID <- < "}" (~"\${" .)* "\${" >;
    QUASI_TAIL <- < "}" (~"\${" .)* "\`" > WS;


    # A.2 Expressions

    dataLiteral <-
      "undefined" WS     ${_ => ['data', undefined]}
    / super.dataLiteral;

    useVar <- IDENT                                       ${id => ['use', id]};

    # Justin does not contain variable definitions, only uses. However,
    # multiple languages that extend Justin will contain defining
    # occurrences of variable names, so we put the defVar production
    # here.
    defVar <- IDENT                                       ${id => ['def', id]};


    primaryExpr <-
      super.primaryExpr
    / quasiExpr
    / LEFT_PAREN expr RIGHT_PAREN                         ${(_, e, _2) => e}
    / useVar;

    element <-
      super.element
    / ELLIPSIS assignExpr                                 ${(_, e) => ['spread', e]};

    propDef <-
      super.propDef
    / useVar                                              ${id => ['prop', id, id]}
    / ELLIPSIS assignExpr                                 ${(_, e) => ['spreadObj', e]};

    # No computed property name
    propName <-
      super.propName
    / IDENT_NAME
    / NUMBER;

    quasiExpr <-
      QUASI_ALL                                            ${q => ['quasi', [q]]}
    / QUASI_HEAD (expr ** QUASI_MID)? QUASI_TAIL           ${(h, ms, t) => ['quasi', qunpack(h, ms, t)]};

    # to be extended
    memberPostOp <-
      WS LEFT_BRACKET indexExpr RIGHT_BRACKET              ${(_, _2, e, _3) => ['index', e]}
    / DOT IDENT_NAME                                       ${(_, id) => ['get', id]}
    / quasiExpr                                            ${q => ['tag', q]};

    # to be extended
    callPostOp <-
      memberPostOp
    / args                                                 ${args => ['call', args]};

    # Because Justin and Jessie have no "new" or "super", they don't need
    # to distinguish callExpr from memberExpr. So justin omits memberExpr
    # and newExpr. Instead, in Justin, callExpr jumps directly to
    # primaryExpr and updateExpr jumps directly to callExpr.

    # to be overridden.
    callExpr <- primaryExpr callPostOp*                   ${binary};

    # To be overridden rather than inherited.
    # Introduced to impose a non-JS restriction
    # Restrict index access to number-names, including
    # floating point, NaN, Infinity, and -Infinity.
    indexExpr <-
      NUMBER                                               ${n => ['data', n]}
    / PLUS unaryExpr                                       ${(_, e) => [`pre:+`, e]};

    args <- LEFT_PAREN arg ** COMMA RIGHT_PAREN            ${(_, args, _2) => args};

    arg <-
      assignExpr
    / ELLIPSIS assignExpr                                  ${(_, e) => ['spread', e]};

    # to be overridden
    updateExpr <- callExpr;

    unaryExpr <-
      preOp unaryExpr                                      ${(op, e) => [op, e]}
    / updateExpr;

    # to be extended
    # No prefix or postfix "++" or "--".
    # No "delete".
    preOp <- ("void" / "typeof" / prePre) WS;
    prePre <- ("+" / "-" / "~" / "!") WS                   ${op => `pre:${op}`};

    # Different communities will think -x**y parses in different ways,
    # so the EcmaScript grammar forces parens to disambiguate.
    powExpr <-
      unaryExpr
    / updateExpr STARSTAR powExpr                          ${(x, op, y) => [op, x, y]};

    multExpr <- powExpr (multOp powExpr)*                  ${binary};
    addExpr <- multExpr (addOp multExpr)*                  ${binary};
    shiftExpr <- addExpr (shiftOp addExpr)*                ${binary};

    # Non-standard, to be overridden
    # In C-like languages, the precedence and associativity of the
    # relational, equality, and bitwise operators is surprising, and
    # therefore hazardous. Here, none of these associate with the
    # others, forcing parens to disambiguate.
    eagerExpr <- shiftExpr (eagerOp shiftExpr)?           ${binary};

    andThenExpr <- eagerExpr (andThenOp eagerExpr)*       ${binary};
    orElseExpr <- andThenExpr (orElseOp andThenExpr)*     ${binary};

    multOp <- ("*" / "/" / "%") WS;
    addOp <- ("+" / "-") WS;
    shiftOp <- ("<<" / ">>" / ">>>") WS;
    relOp <- ("<" / ">" / "<=" / ">=") WS;
    eqOp <- ("===" / "!==") WS;
    bitOp <- ("&" / "^" / "|") WS;

    eagerOp <- relOp / eqOp / bitOp;

    andThenOp <- "&&" WS;
    orElseOp <- "||" WS;

    condExpr <-
      orElseExpr
    / orElseExpr QUESTION assignExpr COLON assignExpr   ${(c, _, t, _2, e) => ['cond', c, t, e]};

    # override, to be extended
    assignExpr <- condExpr;

    # The comma expression is not in Justin and Jessie because we
    # have bond(base, 'name')(args) in order to avoid passing
    # base as the this-binding to the function found at base.name.
    expr <- assignExpr;
  `;
}
export default harden(makeJustin);
//# sourceMappingURL=quasi-justin.mjs.js.map