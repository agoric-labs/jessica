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
/// <reference path="peg.d.ts"/>
import quasiUtils from './quasi-utils.mjs';
const { qunpack } = quasiUtils;
const binary = immunize((left, rights) => {
    return rights.reduce((prev, [op, right]) => [op, prev, right], left);
});
const transformSingleQuote = immunize((s) => {
    let i = 0, qs = '';
    while (i < s.length) {
        const c = s.slice(i, i + 1);
        if (c === '\\') {
            // Skip one char.
            qs += s.slice(i, i + 2);
            i += 2;
        }
        else if (c === '"') {
            // Quote it.
            qs += '\\"';
            i++;
        }
        else {
            // Add it directly.
            qs += c;
            i++;
        }
    }
    return `"${qs}"`;
});
const makeJustin = immunize((peg) => {
    const { SKIP } = peg;
    return peg `
    # to be overridden or inherited
    start <- _WS assignExpr _EOF                       ${v => (..._a) => v};

    # A.1 Lexical Grammar

    DOT <- "." _WS;
    ELLIPSIS <- "..." _WS;
    LEFT_PAREN <- "(" _WS;
    QUESTION <- "?" _WS;
    RIGHT_PAREN <- ")" _WS;
    STARSTAR <- "**" _WS;

    # Define Javascript-style comments.
    # _WSN is whitespace or a non-ident character.
    _WSN <- super._WSN _WS                              ${_ => SKIP};
    _WS <- super._WS (EOL_COMMENT / MULTILINE_COMMENT / super._WS) ${_ => SKIP};
    EOL_COMMENT <- "//" (~[\n\r] .)* _WS;
    MULTILINE_COMMENT <- "/*" (~"*/" .)* "*/" _WS;

    # Add single-quoted strings.
    STRING <-
      super.STRING
    / "'" < (~"'" character)* > "'" _WS  ${s => transformSingleQuote(s)};

    # Only match if whitespace doesn't contain newline
    _NO_NEWLINE <- ~IDENT [ \t]*     ${_ => SKIP};

    IDENT_NAME <- ~"__proto__" (IDENT / RESERVED_WORD);

    IDENT <- < [$A-Za-z_] [$A-Za-z0-9_]* > _WS;

    # Omit "async", "arguments", "eval", "get", and "set" from IDENT
    # in Justin even though ES2017 considers them in IDENT.
    RESERVED_WORD <-
      (KEYWORD / RESERVED_KEYWORD / FUTURE_RESERVED_WORD
    / "null" / "false" / "true"
    / "async" / "arguments" / "eval" / "get" / "set") _WSN;

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
    / "while") _WSN;

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
    / "yield") _WSN;

    FUTURE_RESERVED_WORD <-
      ("await" / "enum"
    / "implements" / "package" / "protected"
    / "interface" / "private" / "public") _WSN;

    # Quasiliterals aka template literals
    QUASI_CHAR <- "\\" . / ~"\`" .;
    QUASI_ALL <- "\`" < (~"\${" QUASI_CHAR)* > "\`" _WS;
    QUASI_HEAD <- "\`" < (~"\${" QUASI_CHAR)* "\${" >;
    QUASI_MID <- < "}" (~"\${" QUASI_CHAR)* "\${" >;
    QUASI_TAIL <- < "}" (~"\${" QUASI_CHAR)* > "\`" _WS;


    # A.2 Expressions

    dataStructure <-
      "undefined" _WSN     ${_ => ['data', undefined]}
    / super.dataStructure;

    # Optional trailing commas.
    record <-
      super.record
    / LEFT_BRACE propDef ** COMMA COMMA? RIGHT_BRACE  ${(_, ps, _2) => ['record', ps]};

    array <-
      super.array
    / LEFT_BRACKET (element ** COMMA) COMMA? RIGHT_BRACKET ${(_, es, _2) => ['array', es]};


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
    / QUASI_HEAD expr ** QUASI_MID QUASI_TAIL              ${(h, ms, t) => ['quasi', qunpack(h, ms, t)]};

    # to be extended
    memberPostOp <-
      _WS LEFT_BRACKET indexExpr RIGHT_BRACKET              ${(_, e, _3) => ['index', e]}
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
    preOp <- (("void" / "typeof") _WSN / prePre);
    prePre <- ("+" / "-" / "~" / "!") _WS                 ${op => `pre:${op}`};

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
    eagerExpr <- shiftExpr (eagerOp shiftExpr)?            ${binary};

    andThenExpr <- eagerExpr (andThenOp eagerExpr)*       ${binary};
    orElseExpr <- andThenExpr (orElseOp andThenExpr)*     ${binary};

    multOp <- ("*" / "/" / "%") _WS;
    addOp <- ("+" / "-") _WS;
    shiftOp <- ("<<" / ">>>" / ">>") _WS;
    relOp <- ("<=" / "<" / ">=" / ">") _WS;
    eqOp <- ("===" / "!==") _WS;
    bitOp <- ("&" / "^" / "|") _WS;

    eagerOp <- relOp / eqOp / bitOp;

    andThenOp <- "&&" _WS;
    orElseOp <- "||" _WS;

    condExpr <-
      orElseExpr QUESTION assignExpr COLON assignExpr   ${(c, _, t, _2, e) => ['cond', c, t, e]}
    / orElseExpr;

    # override, to be extended
    assignExpr <- condExpr;

    # The comma expression is not in Justin and Jessie because we
    # have bond(base, 'name')(args) in order to avoid passing
    # base as the this-binding to the function found at base.name.
    expr <- assignExpr;
  `;
});
export default makeJustin;
