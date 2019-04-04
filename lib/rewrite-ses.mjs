// DO NOT EDIT - Generated automatically from rewrite-ses.mjs.ts by tessc


const hide = immunize(vname => `\$h_${vname}`);
const moduleRewriteSES = immunize(moduleAST => {
  const EXPORTS = hide('exports');
  const DEFINE = hide('define');
  const imports = makeMap();
  const rewriters = {
    exportDefaultX(val) {
      return `${EXPORTS}.default = ${doRewrite(val)};`;
    },
    import(clause, fromModule) {
      // Save the bindings.
      const bindings = clause.reduce((prior, cur) => prior + doRewrite(cur), '');
      imports.set(fromModule, bindings);
      // We don't do anything until later.
      return '';
    },
    moduleX(decls) {
      const body = decls.reduce((prior, cur) => prior + doRewrite(cur), '');
      const modules = [];
      let bindings = '';
      let comma = '';
      for (const [mod, binding] of imports.entries()) {
        modules.push(mod);
        bindings += comma + binding;
        comma = ', ';
      }
      return `${DEFINE}(
${JSON.stringify(modules)},
(${bindings}) => {
const ${EXPORTS} = {};
${body}
return ${EXPORTS};
});`;
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