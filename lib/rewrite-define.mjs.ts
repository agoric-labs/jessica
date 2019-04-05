type Rewriter = (...args: any) => string;
type Node = any[] | string;
const hide = (vname: string) => `\$h_${vname}`;

// Return a string separated by separators.
const separate = (strs: string[], sep: string) => {
    let ret = '';
    let actualSep = '';
    for (const str of strs) {
        if (str !== '') {
            ret += actualSep + str;
            actualSep = sep;
        }
    }
    return ret;
};

const moduleRewriteDefine = (moduleAST: any[], DEFINE = hide('define')) => {
    const EXPORTS = hide('exports');
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
            const bindings = separate(binds.map(doRewrite), ', ');
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
            return separate(bindings.map(doRewrite), ', ');
        },
        matchArray(es: Node[]) {
            return `[${separate(es.map(doRewrite), ', ')}]`;
        },
        matchProp(kw: string, prop: Node) {
            const rewrite = doRewrite(prop);
            if (kw === rewrite) {
                return kw;
            }
            return `${kw}: ${rewrite}`;
        },
        matchRecord(es: Node[]) {
            return `{${separate(es.map(doRewrite), ', ')}}`;
        },
        moduleX(decls: Node[]) {
            const body = decls.reduce<string>((prior, cur) => prior + doRewrite(cur), '');
            const modules: string[] = [];
            const names: string[] = [];
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

export default moduleRewriteDefine;
