// Originally from src/bootbnf.js
function simple(prefix, list) {
    if (list.length === 0) { return ['empty']; }
    if (list.length === 1) { return list[0]; }
    return [prefix, ...list];
}

// TODO: Implement bootbnf and sc constants as part of this module.
function qBnf(bootbnf, sc) {
    const bnf = bootbnf.bnf.extends(sc.scannerless)`
      start ::= rule+ EOF            ${bootbnf.metaCompile};
      rule ::= IDENT "::=" body ";"  ${(name,_,body,_2) => ['def', name, body]};
      body ::= choice ** "/"         ${list => simple('or', list)};
      choice ::=
        seq HOLE                     ${(list,hole) => ['act', list, hole]}
      / seq                          ${list => simple('seq', list)};
      seq ::= term*;
      term ::=
        prim ("**" / "++") prim      ${(patt,q,sep) => [q, patt, sep]}
      / prim ("?" / "*" / "+")       ${(patt,q) => [q, patt]}
      / prim;
      prim ::=
        "super" "." IDENT            ${(sup,_,id) => [sup, id]}
      / "this" "." HOLE              ${(_,_2,hole) => ['apply', hole]}
      / IDENT / STRING
      / "(" body ")"                 ${(_,b,_2) => b};
    `;

    function wrapExports(bnf) {
      bnf.FAIL = sc.FAIL;
      bnf.re = sc.re;
      bnf.match = sc.match;
      bnf.skip = sc.skip;
    }
    bnf.extends = function wrapExtends(...args) {
        const ext = bootbnf.bnf.extends.apply(bnf, args);
        wrapExports(ext);
        return ext;
    };
    wrapExports(bnf);
    return bnf;
}

export default harden(qBnf);
