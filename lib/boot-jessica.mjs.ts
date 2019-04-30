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

import { ConfineOptions } from '@agoric/jessie/lib/confine.mjs';

const bootJessica = (
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

    const jessica = {
        eval: (src: string): any => {
            return jessica.runExpr(src, {eval: jessica.eval});
        },
        runExpr: (src: string, evalenv: Record<string, any>, options: ConfineOptions = {}) => {
            let tag = tagString<any[]>(jessieExprTag, options.scriptName);
            if (options.debug) {
                tag = tag('DEBUG');
            }
            const ast = tag`${src}`;
            return interpJessie(ast, evalenv, options || {});
        },
        runModule: (src: string, evalenv: Record<string, any>, options: ConfineOptions = {}) => {
            let tag = tagString<any[]>(jessieTag, options.scriptName);
            if (options.debug) {
                tag = tag('DEBUG');
            }
            const ast = tag`${src}`;
            return interpJessie(ast, evalenv, options || {}).default;
        },
    };
    return jessica;
};

export default bootJessica;
