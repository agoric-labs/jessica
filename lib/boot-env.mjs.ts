import bootPeg from './boot-peg.mjs';
import bootPegAst from './boot-pegast.mjs';
import makeJessie from './quasi-jessie.mjs';
import makeJSON from './quasi-json.mjs';
import makeJustin from './quasi-justin.mjs';
import makePeg from './quasi-peg.mjs';

import makeImporter from './importer.mjs';
import makeInterpJessie from './interp-jessie.mjs';
import tagString from './tag-string.mjs';

function bootEnv(endowments: Record<string, any>, readInput: (file: string) => string) {
    // Bootstrap a peg tag.
    const pegTag = bootPeg<IPegTag<any>>(makePeg, bootPegAst);

    // Stack up the parser.
    const jsonTag = makeJSON(pegTag);
    const justinTag = makeJustin(pegTag.extends(jsonTag));
    const jessieTag = makeJessie(pegTag.extends(justinTag));

    const importer = makeImporter(readInput, jessieTag);
    const interpJessie = makeInterpJessie(importer);

    const env = harden({
        ...endowments,
        confine: (src: string, evalenv: object, options?: ConfineOptions) => {
            const ast = tagString<any[]>(jessieTag, options.scriptName)`${src + '\n;'}`;
            return harden(interpJessie(ast, evalenv, options || {}));
        },
        confineExpr: (src: string, evalenv: object, options?: ConfineOptions) => {
            const ast = tagString<any[]>(jessieTag, options.scriptName)`${'(' + src + '\n)'}`;
            return harden(interpJessie.expr(ast, evalenv, options || {}));
        },
        eval: (src: string): any => {
            const ast = tagString<any[]>(jessieTag)`${src}`;
            return interpJessie(ast, env);
        },
    });
    return env;
}

export default harden(bootEnv);
