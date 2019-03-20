import bootPeg from './boot-peg.mjs';
import bootPegAst from './boot-pegast.mjs';
import makeJessie from './quasi-jessie.mjs';
import makeJSON from './quasi-json.mjs';
import makeJustin from './quasi-justin.mjs';
import makePeg from './quasi-peg.mjs';

import makeImporter from './importer.mjs';
import makeInterpJessie from './interp-jessie.mjs';
import tagString from './tag-string.mjs';

const bootEnv = immunize((
    endowments: Record<string, any>,
    readInput: (file: string) => string,
    setComputedIndex: (obj: Record<string | number, any>, index: string | number, value: any) => void) => {
    // Bootstrap a peg tag.
    const pegTag = bootPeg<IPegTag<any>>(makePeg, bootPegAst);

    // Stack up the parser.
    const jsonTag = makeJSON(pegTag);
    const justinTag = makeJustin(pegTag.extends(jsonTag));
    const jessieTag = makeJessie(pegTag.extends(justinTag));

    const importer = makeImporter(readInput, jessieTag);
    const interpJessie = makeInterpJessie(importer, setComputedIndex);

    const env = {
        ...endowments,
        confine: (src: string, evalenv: object, options?: ConfineOptions) => {
            const ast = tagString<any[]>(jessieTag, options.scriptName)`${src + '\n;'}`;
            return interpJessie(ast, evalenv, options || {});
        },
        confineExpr: (src: string, evalenv: object, options?: ConfineOptions) => {
            // FIXME: Use the `expr` starting point for jessieTag.
            const ast = tagString<any[]>(jessieTag.expr, options.scriptName)`${'(' + src + '\n)'}`;
            return interpJessie(ast, evalenv, options || {});
        },
        eval: (src: string): any => {
            const ast = tagString<any[]>(jessieTag)`${src}`;
            return interpJessie(ast, env);
        },
    };
    return env;
});

export default bootEnv;
