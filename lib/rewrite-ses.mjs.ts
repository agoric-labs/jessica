type Rewriter = (...args: any) => string;
type Node = any[] | string;
const hide = (vname: string) => `\$h_${vname}`;
const moduleRewriteSES = (moduleAST: any[]) => {
    const EXPORTS = hide('exports');
    const DEFINE = hide('define');
    const imports = makeMap<string, string>();
    const exportVars = makeSet<string>();
    let starName: string;
    let nImport = 0;
    const rewriters: Record<string, Rewriter> = {
        as(imp: string, sym: string) {
            if (imp === '*') {
                starName = sym;
                return '';
            }
            return `${imp}: ${sym}`;
        },
        bind(def: Node, expr: Node) {
            const name = doRewrite(def);
            return `${name} = ${doRewrite(expr)}`;
        },
        def(name: string) {
            exportVars.add(name);
            return name;
        },
        exportDefaultX(val: Node[]) {
            return `${EXPORTS}.default = ${doRewrite(val)};`;
        },
        exportX(qual: string, binds: Node[]) {
            exportVars.clear();
            let bindings = '', comma = '';
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
        import(clause: Node[], fromModule: string) {
            // Save the bindings.
            starName = undefined;
            const bindings = doRewrite(clause);
            if (starName === undefined) {
                starName = hide(`star${nImport ++}`);
            }
            imports.set(fromModule, starName);
            if (bindings) {
                return `const {${bindings}} = ${starName};\n`;
            }
            return '';
        },
        importBind(bindings: Node[]) {
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
        matchArray(es: Node[]) {
            let arr = '';
            let comma = '';
            for (const e of es) {
                arr += comma + doRewrite(e);
                comma = ', ';
            }
            return `[${arr}]`;
        },
        matchProp(kw: string, prop: Node) {
            const rewrite = doRewrite(prop);
            if (kw === rewrite) {
                return kw;
            }
            return `${kw}: ${rewrite}`;
        },
        matchRecord(es: Node[]) {
            let rec = '';
            let comma = '';
            for (const e of es) {
                rec += comma + doRewrite(e);
                comma = ', ';
            }
            return `{${rec}}`;
        },
        moduleX(decls: Node[]) {
            const body = decls.reduce<string>((prior, cur) => prior + doRewrite(cur), '');
            const modules: string[] = [];
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
        rest(expr: Node) {
            return `...${doRewrite(expr)}`;
        },
        restObj(expr: Node) {
            return `...${doRewrite(expr)}`;
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
