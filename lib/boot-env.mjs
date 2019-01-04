import qBnf from './quasi-bnf.mjs';
import qJSON from './quasi-json.mjs';
import qJustin from './quasi-justin.mjs';
import qJessie from './quasi-jessie.mjs';

import interpJessie from './interp-jessie.mjs';

function tagString(template, ...args) {
    const cooked = args.reduce((prior, hole, i) => {
        prior.push(String(hole), template[i + 1]);
        return prior;
    }, [template[0]]);
    const tmpl = [cooked.join('')];
    const raw = args.reduce((prior, hole, i) => {
        prior.push(String(hole), template.raw[i + 1]);
        return prior;
    }, [template.raw[0]]);
    tmpl.raw = [raw.join('')];
    return tmpl;
}

function bootEnv(endowments, bootbnf, sc) {
    // Implement our bnf tag.
    const bnfTag = qBnf(bootbnf, sc);
    
    // Stack up the parser.
    const jsonTag = qJSON(bnfTag);
    const justinTag = qJustin(bnfTag.extends(jsonTag));
    const jessieTag = qJessie(bnfTag.extends(justinTag));

    const env = harden({
        ...endowments,
        confine: (src, evalenv, options) => {
            const ast = jessieTag(tagString`${src + '\n;'}`);
            return harden(interpJessie(ast, evalenv, options || {}));
        },
        confineExpr: (src, evalenv, options) => {
            const ast = jessieTag(tagString`${'(' + src + '\n)'}`);
            return harden((1,interpJessie).expr(ast, evalenv, options || {}));
        },
        eval: (src) => {
            const ast = jessieTag(tagString`${src}`);
            return harden(interpJessie(ast, env));
        },
    });
    return env;
}

export default harden(bootEnv);
