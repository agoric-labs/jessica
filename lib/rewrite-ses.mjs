// DO NOT EDIT - Generated automatically from rewrite-ses.mjs.ts by tessc


const hide = immunize(vname => `\$h_${vname}`);
const moduleRewriteSES = immunize(moduleAST => {
  const EXPORTS = hide('exports');
  const DEFINE = hide('define');
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
      let bindings = '',comma = '';
      for (const bind of binds) {
        bindings += comma + doRewrite(bind);
        comma = ', ';
      }
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
      let bound = '';
      let comma = '';
      for (const binding of bindings) {
        const b = doRewrite(binding);
        if (b !== '') {
          bound += comma + doRewrite(binding);
          comma = ', ';
        }
      }
      return bound;
    },
    matchArray(es) {
      let arr = '';
      let comma = '';
      for (const e of es) {
        arr += comma + doRewrite(e);
        comma = ', ';
      }
      return `[${arr}]`;
    },
    matchProp(kw, prop) {
      const rewrite = doRewrite(prop);
      if (kw === rewrite) {
        return kw;
      }
      return `${kw}: ${rewrite}`;
    },
    matchRecord(es) {
      let rec = '';
      let comma = '';
      for (const e of es) {
        rec += comma + doRewrite(e);
        comma = ', ';
      }
      return `{${rec}}`;
    },
    moduleX(decls) {
      const body = decls.reduce((prior, cur) => prior + doRewrite(cur), '');
      const modules = [];
      let bindings = '';
      let comma = '';
      for (const [mod, name] of imports.entries()) {
        modules.push(mod);
        bindings += comma + name;
        comma = ', ';
      }
      return `${DEFINE}(
${JSON.stringify(modules)},
(${bindings}) => {
const ${EXPORTS} = {};
${body}
return ${EXPORTS};
});`;
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

export default immunize(moduleRewriteSES);