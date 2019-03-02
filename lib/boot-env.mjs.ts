import bootPeg from './boot-peg.mjs';
import bootPegAst from './boot-pegast.mjs';
import makeJessie from './quasi-jessie.mjs';
import makeJSON from './quasi-json.mjs';
import makeJustin from './quasi-justin.mjs';
import makePeg from './quasi-peg.mjs';

import interpJessie from './interp-jessie.mjs';
import tagString from './tag-string.mjs';

function bootEnv(endowments: object) {
    // Bootstrap a peg tag.
    const pegTag = bootPeg<IPegTag>(makePeg, bootPegAst);

    // Stack up the parser.
    const jsonTag = makeJSON(pegTag);
    const justinTag = makeJustin(pegTag, jsonTag);
    const jessieTag = makeJessie(pegTag, justinTag);

    const env = harden({
        ...endowments,
        confine: (src: string, evalenv: object, options?: ConfineOptions) => {
            const ast = tagString(jessieTag)`${src + '\n;'}`;
            return harden(interpJessie(ast, evalenv, options || {}));
        },
        confineExpr: (src: string, evalenv: object, options?: ConfineOptions) => {
            const ast = tagString(jessieTag)`${'(' + src + '\n)'}`;
            return harden(interpJessie.expr(ast, evalenv, options || {}));
        },
        eval: (src: string): any => {
            const ast = tagString(jessieTag)`${src}`;
            return harden(interpJessie(ast, env));
        },
    });
    return env;
}

export default harden(bootEnv);
