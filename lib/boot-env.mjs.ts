import bootPeg from './boot-peg.mjs';
import bootPegAst from './boot-pegast.mjs';
import makeJessie from './quasi-jessie.mjs';
import makeJSON from './quasi-json.mjs';
import makeJustin from './quasi-justin.mjs';
import makePeg from './quasi-peg.mjs';

import makeImporter from './importer.mjs';
import jessieEvaluators from './interp-jessie.mjs';
import makeInterp from './interp-utils.mjs';
import tagString from './tag-string.mjs';

const bootEnv = (
    endowments: Record<string, any>,
    applyMethod: IMainDependencies['applyMethod'],
    readInput: IMainDependencies['readInput'],
    setComputedIndex: IMainDependencies['setComputedIndex']) => {
    // Bootstrap a peg tag.
    const pegTag = bootPeg<IPegTag<any>>(makePeg, bootPegAst);

    // Stack up the parser.
    const jsonTag = makeJSON(pegTag);
    const justinTag = makeJustin(pegTag.extends(jsonTag));
    const [jessieTag, jessieExprTag] = makeJessie(pegTag, pegTag.extends(justinTag));

    const importer = makeImporter(readInput, jessieTag);
    const interpJessie = makeInterp(jessieEvaluators, applyMethod, importer, setComputedIndex);

    const env = {
        ...endowments,
        confine: (src: string, evalenv: object, options: ConfineOptions = {}) => {
            let tag = tagString<any[]>(jessieTag, options.scriptName);
            if (options.debug) {
                tag = tag('DEBUG');
            }
            const ast = tag`${src}`;
            return interpJessie(ast, evalenv, options || {}).default;
        },
        confineExpr: (src: string, evalenv: object, options: ConfineOptions = {}) => {
            let tag = tagString<any[]>(jessieExprTag, options.scriptName);
            if (options.debug) {
                tag = tag('DEBUG');
            }
            const ast = tag`${src}`;
            return interpJessie(ast, evalenv, options || {});
        },
        eval: (src: string): any => {
            return confineExpr(src, env);
        },
    };
    return env;
};

export default bootEnv;
