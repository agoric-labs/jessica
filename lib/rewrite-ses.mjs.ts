type Rewriter = (...args: any) => string;
type Node = any[] | string;
const hide = (vname: string) => `\$h_${vname}`;
const moduleRewriteSES = (moduleAST: any[]) => {
    const EXPORTS = hide('exports');
    const DEFINE = hide('define');
    const imports = makeMap<string, string>();
    const rewriters: Record<string, Rewriter> = {
        exportDefaultX(val: Node[]) {
            return `${EXPORTS}.default = ${doRewrite(val)};`;
        },
        import(clause: Node[], fromModule: string) {
            // Save the bindings.
            const bindings = clause.reduce<string>((prior, cur) => prior + doRewrite(cur), '');
            imports.set(fromModule, bindings);
            // We don't do anything until later.
            return '';
        },
        moduleX(decls: Node[]) {
            const body = decls.reduce<string>((prior, cur) => prior + doRewrite(cur), '');
            const modules: string[] = [];
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
        },
    };

    const doRewrite = (node: Node) => {
        if (typeof node === 'string') {
            return node;
        }
        const [name, ...args] = node;
        const rewriter = rewriters[name];
        if (!rewriter) {
            throw slog.error`No rewriter for ${{name}}`;
        }
        return rewriter(...args);
    };
    return doRewrite(moduleAST);
};

export default moduleRewriteSES;
