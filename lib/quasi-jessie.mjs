// DO NOT EDIT - Generated automatically from quasi-jessie.mjs.ts by tessc
// Subsets of JavaScript, starting from the grammar as defined at
// http://www.ecma-international.org/ecma-262/9.0/#sec-grammar-summary
// See https://github.com/Agoric/Jessie/blob/master/README.md
// for documentation of the Jessie grammar defined here.
/// <reference path="peg.d.ts"/>
const makeJessie = immunize((peg) => {
    const { SKIP } = peg;
    return peg `
    # Override rather than inherit start production.
    # Only module syntax is permitted.
    start <- _WS moduleBody _EOF               ${b => (..._a) => ['module', b]};

    # A.1 Lexical Grammar

    # For proposed eventual send expressions
    LATER <- _NO_NEWLINE "!" _WS;

    # A.2 Expressions

    # Jessie primaryExpr does not include "this", ClassExpression,
    # GeneratorExpression, AsyncFunctionExpression,
    # AsyncGenerarorExpression, or RegularExpressionLiteral.
    primaryExpr <-
      super.primaryExpr
    / functionExpr;

    propDef <-
      super.propDef
    / methodDef;

    purePropDef <-
      super.purePropDef
    / methodDef;

    # Extend to recognize proposed eventual get syntax.
    memberPostOp <-
      super.memberPostOp
    / LATER LEFT_BRACKET indexExpr RIGHT_BRACKET           ${(_, _2, e, _3) => ['indexLater', e]}
    / LATER IDENT_NAME                                     ${(_, id) => ['getLater', id]};

    # Extend to recognize proposed eventual send syntax.
    # We distinguish b!foo(x) from calling b!foo by a post-parsing pass
    callPostOp <-
      super.callPostOp
    / LATER args                                           ${(_, args) => ['callLater', args]};

    # to be extended
    assignExpr <-
      arrowFunc
    / lValue (EQUALS / assignOp) assignExpr                ${(lv, op, rv) => [op, lv, rv]}
    / super.assignExpr;

    # An expression without side-effects.
    pureExpr <-
      arrowFunc
    / super.pureExpr;

    # In Jessie, an lValue is only a variable, a computed index-named
    # property (an array element), or a statically string-named
    # property.
    # We allow assignment to statically string-named fields, since it
    # is useful during initialization and prevented thereafter by
    # mandatory tamper-proofing.

    # to be overridden or extended
    lValue <-
      primaryExpr LEFT_BRACKET indexExpr RIGHT_BRACKET     ${(pe, _, e, _2) => ['index', pe, e]}
    / primaryExpr LATER LEFT_BRACKET indexExpr RIGHT_BRACKET ${(pe, _, _2, e, _3) => ['indexLater', pe, e]}
    / primaryExpr DOT IDENT_NAME                           ${(pe, _, id) => ['get', pe, id]}
    / primaryExpr LATER IDENT_NAME                         ${(pe, _, id) => ['getLater', pe, id]}
    / useVar;

    assignOp <-
      ("*=" / "/=" / "%=" / "+=" / "-="
    / "<<=" / ">>=" / ">>>="
    / "&=" / "^=" / "|="
    / "**=") _WS;


    # A.3 Statements

    # to be extended.
    # The exprStatement production must go last, so PEG's prioritized
    # choice will interpret {} as a block rather than an expression.
    statement <-
      block
    / IF LEFT_PAREN expr RIGHT_PAREN arm ELSE arm          ${(_, _2, c, _3, t, _4, e) => ['if', c, t, e]}
    / IF LEFT_PAREN expr RIGHT_PAREN arm                   ${(_, _2, c, _3, t) => ['if', c, t]}
    / breakableStatement
    / terminator
    / IDENT COLON statement                                ${(label, _, stat) => ['label', label, stat]}
    / IDENT COLON functionDecl                             ${(label, _, func) => ['label', label, func]}
    / TRY block catcher finalizer                          ${(_, b, c, f) => ['try', b, c, f]}
    / TRY block catcher                                    ${(_, b, c) => ['try', b, c]}
    / TRY block finalizer                                  ${(_, b, f) => ['try', b, f]}
    / DEBUGGER SEMI                                        ${(_, _2) => ['debugger']}
    / exprStatement;

    # to be overridden.  In Jessie, only blocks are accepted as arms
    # of flow-of-control statements.
    arm <- block;

    breakableStatement <-
      FOR LEFT_PAREN declaration expr? SEMI expr? RIGHT_PAREN arm ${(_, _2, d, c, _3, i, _4, b) => ['for', d, c, i, b]}
    / FOR LEFT_PAREN declOp binding OF expr RIGHT_PAREN arm       ${(_, _2, d, _3, e, _4, b) => ['forOf', d, e, b]}
    / WHILE LEFT_PAREN expr RIGHT_PAREN arm                       ${(_, _2, c, _3, b) => ['while', c, b]}
    / SWITCH LEFT_PAREN expr RIGHT_PAREN LEFT_BRACE clause* RIGHT_BRACE
            ${(_, _2, e, _3, _4, bs, _5) => ['switch', e, bs]};

    # Each case clause must end in a terminating statement.
    terminator <-
      "continue" _NO_NEWLINE IDENT SEMI                ${(_, label, _3) => ['continue', label]}
    / "continue" _WS SEMI                              ${(_, _2) => ['continue']}
    / "break" _NO_NEWLINE IDENT SEMI                   ${(_, label, _2) => ['break', label]}
    / "break" _WS SEMI                                 ${(_, _2) => ['break']}
    / "return" _NO_NEWLINE expr SEMI                   ${(_, e, _2) => ['return', e]}
    / "return" _WS SEMI                                ${(_, _2) => ['return']}
    / "throw" _NO_NEWLINE expr SEMI                    ${(_, e, _3) => ['throw', e]};

    block <- LEFT_BRACE body RIGHT_BRACE              ${(_, b, _2) => ['block', b]};
    body <- statementItem*;

    # declaration must come first, so that PEG will prioritize
    # function declarations over exprStatement.
    statementItem <-
      declaration
    / statement;

    # No "class" declaration.
    # No generator, async, or async iterator function.
    declaration <-
      declOp binding ** COMMA SEMI                    ${(op, decls, _) => [op, decls]}
    / functionDecl;

    declOp <- ("const" / "let") _WSN;

    binding <-
      bindingPattern EQUALS assignExpr                ${(p, _, e) => ['bind', p, e]}
    / defVar EQUALS assignExpr                        ${(p, _, e) => ['bind', p, e]}
    / defVar;

    bindingPattern <-
      LEFT_BRACKET elementParam ** COMMA RIGHT_BRACKET     ${(_, ps, _2) => ['matchArray', ps]}
    / LEFT_BRACE propParam ** COMMA RIGHT_BRACE            ${(_, ps, _2) => ['matchRecord', ps]};

    pattern <-
      bindingPattern
    / defVar
    / dataLiteral                                     ${n => ['matchData', JSON.parse(n)]}
    / HOLE                                            ${h => ['patternHole', h]};

    # to be overridden
    elementParam <- param;

    param <-
      ELLIPSIS pattern                                ${(_, p) => ['rest', p]}
    / defVar EQUALS assignExpr                        ${(v, _, e) => ['optional', v, e]}
    / pattern;

    propParam <-
      ELLIPSIS pattern                                ${(_, p) => ['restObj', p]}
    / propName COLON pattern                          ${(k, _, p) => ['matchProp', k, p]}
    / defVar EQUALS assignExpr                        ${(id, _, e) => ['optionalProp', id, id, e]}
    / defVar                                          ${id => ['matchProp', id, id]};

    # Use PEG prioritized choice.
    # TODO emit diagnostic for failure cases.
    exprStatement <-
      ~cantStartExprStatement expr SEMI               ${(e, _2) => e};

    cantStartExprStatement <-
      ("{" / "function" / "async" _NO_NEWLINE "function"
    / "class" / "let" / "[");

    # to be overridden
    clause <- caseLabel+ LEFT_BRACE body terminator RIGHT_BRACE ${(cs, _, b, t, _2) => ['clause', cs, [...b, t]]};
    caseLabel <-
      CASE expr COLON                                 ${(_, e) => ['case', e]}
    / DEFAULT _WS COLON                                ${(_, _2) => ['default']};

    catcher <- CATCH LEFT_PAREN pattern RIGHT_PAREN block ${(_, _2, p, _3, b) => ['catch', p, b]};
    finalizer <- FINALLY block                        ${(_, b) => ['finally', b]};


    # A.4 Functions and Classes

    functionDecl <-
      FUNCTION defVar LEFT_PAREN param ** COMMA RIGHT_PAREN block
                                                      ${(_, n, _2, p, _3, b) => ['functionDecl', n, p, b]};

    functionExpr <-
      FUNCTION defVar? LEFT_PAREN param ** COMMA RIGHT_PAREN block
                                                      ${(_, n, _2, p, _3, b) => ['functionExpr', n, p, b]};

    # The assignExpr form must come after the block form, to make proper use
    # of PEG prioritized choice.
    arrowFunc <-
      arrowParams _NO_NEWLINE ARROW block              ${(ps, _2, b) => ['arrow', ps, b]}
    / arrowParams _NO_NEWLINE ARROW assignExpr         ${(ps, _2, e) => ['lambda', ps, e]};

    arrowParams <-
      IDENT                                           ${id => [['def', id]]}
    / LEFT_PAREN param ** COMMA RIGHT_PAREN           ${(_, ps, _2) => ps};

    # to be extended
    methodDef <-
      method
    / GET propName LEFT_PAREN RIGHT_PAREN block            ${(_, n, _2, _3, b) => ['getter', n, [], b]}
    / SET propName LEFT_PAREN param RIGHT_PAREN block      ${(_, n, _2, p, _3, b) => ['setter', n, [p], b]};

    method <-
      propName LEFT_PAREN param ** COMMA RIGHT_PAREN block ${(n, _, p, _2, b) => ['method', n, p, b]};


    # A.5 Scripts and Modules

    moduleBody <- moduleItem*;
    moduleItem <-
      SEMI                                               ${_ => SKIP}
    / importDecl
    / exportDecl
    / moduleDeclaration;

    moduleDeclaration <-
      declOp moduleBinding ** COMMA SEMI                 ${(op, decls) => [op, decls]}
    / functionDecl;

    # An immunized expression without side-effects.
    immunizedExpr <-
      dataLiteral                                     ${d => ['data', JSON.parse(d)]}
    / "immunize" _WS LEFT_PAREN pureExpr RIGHT_PAREN  ${(fname, _2, expr, _3) => ['call', ['use', fname], [expr]]};

    # Jessie modules only allow immunized module-level bindings.
    moduleBinding <-
      bindingPattern EQUALS immunizedExpr       ${(p, _, e) => ['bind', p, e]}
    / defVar EQUALS immunizedExpr               ${(p, _, e) => ['bind', p, e]}
    / defVar;

    importDecl <- IMPORT defVar FROM STRING SEMI  ${(i, v, _, s, _2) => [i, v, JSON.parse(s)]};
    exportDecl <- EXPORT DEFAULT exportableExpr SEMI ${(_, _2, e, _3) => ['exportDefault', e]};

    # to be extended
    exportableExpr <- immunizedExpr;


    # Lexical syntax
    ARROW <- "=>" _WS;
    DEBUGGER <- "debugger" _WSN;
    IF <- "if" _WSN;
    ELSE <- "else" _WSN;
    FOR <- "for" _WSN;
    WHILE <- "while" _WSN;
    BREAK <- "break" _WSN;
    CONTINUE <- "continue" _WSN;
    SWITCH <- "switch" _WSN;
    TRY <- "try" _WSN;
    CATCH <- "catch" _WSN;
    FINALLY <- "finally" _WSN;
    GET <- "get" _WSN;
    SET <- "set" _WSN;
    IMPORT <- "import" _WSN;
    EXPORT <- "export" _WSN;
    FROM <- "from" _WSN;
    FUNCTION <- "function" _WSN;
    DEFAULT <- "default" _WSN;
    EQUALS <- "=" _WS;
    SEMI <- ";" _WS;
  `;
});
export default immunize(makeJessie);
