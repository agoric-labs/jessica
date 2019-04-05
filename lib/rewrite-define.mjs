// DO NOT EDIT - Generated automatically from rewrite-define.mjs.ts by tessc


const hide = immunize(vname => `\$h_${vname}`);

// Return a string separated by separators.
const separate = immunize((strs, sep) => {
  let ret = '';
  let actualSep = '';
  for (const str of strs) {
    if (str !== '') {
      ret += actualSep + str;
      actualSep = sep;
    }
  }
  return ret;
});

const moduleRewriteDefine = immunize((moduleAST, DEFINE = hide('define')) => {
  const EXPORTS = hide('exports');
  const imports = makeMap();
  const exportVars = makeSet();
  let starName;
  let nImport = 0;
  const rewriters = {
    as(imp, sym) {
      if (imp === '*') {
        starName = sym;
        return '';
      }
      return `${imp}: ${sym}`;
    },
    bind(def, expr) {
      const name = doRewrite(def);
      return `${name} = ${doRewrite(expr)}`;
    },
    def(name) {
      exportVars.add(name);
      return name;
    },
    exportDefaultX(val) {
      return `${EXPORTS}.default = ${doRewrite(val)};`;
    },
    exportX(qual, binds) {
      exportVars.clear();
      const bindings = separate(binds.map(doRewrite), ', ');
      let assign = '';
      for (const vname of exportVars.keys()) {
        assign += `${EXPORTS}.${vname} = ${vname};\n`;
      }
      exportVars.clear();
      return `${qual} ${bindings};\n${assign}`;
    },
    import(clause, fromModule) {
      // Save the bindings.
      starName = undefined;
      const bindings = doRewrite(clause);
      if (starName === undefined) {
        starName = hide(`star${nImport++}`);
      }
      imports.set(fromModule, starName);
      if (bindings) {
        return `const {${bindings}} = ${starName};\n`;
      }
      return '';
    },
    importBind(bindings) {
      return separate(bindings.map(doRewrite), ', ');
    },
    matchArray(es) {
      return `[${separate(es.map(doRewrite), ', ')}]`;
    },
    matchProp(kw, prop) {
      const rewrite = doRewrite(prop);
      if (kw === rewrite) {
        return kw;
      }
      return `${kw}: ${rewrite}`;
    },
    matchRecord(es) {
      return `{${separate(es.map(doRewrite), ', ')}}`;
    },
    moduleX(decls) {
      const body = decls.reduce((prior, cur) => prior + doRewrite(cur), '');
      const modules = [];
      const names = [];
      for (const [mod, name] of imports.entries()) {
        modules.push(mod);
        names.push(name);
      }
      const bindings = separate(names, ', ');
      return `${DEFINE}(
${JSON.stringify(modules)},
(${bindings}) => {
const ${EXPORTS} = {};
${body}
return ${EXPORTS};
})`;
    },
    rest(expr) {
      return `...${doRewrite(expr)}`;
    },
    restObj(expr) {
      return `...${doRewrite(expr)}`;
    } };


  const doRewrite = node => {
    if (typeof node === 'string') {
      return node;
    }
    const [name, ...args] = node;
    const rewriter = rewriters[name];
    if (!rewriter) {
      throw slog.error`No rewriter for ${{ name }}`;
    }
    return rewriter(...args);
  };
  return doRewrite(moduleAST);
});

export default immunize(moduleRewriteDefine);