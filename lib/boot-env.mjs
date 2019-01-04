import qBnf from './quasi-bnf.mjs';
import qJSON from './quasi-json.mjs';
import qJustin from './quasi-justin.mjs';
import qJessie from './quasi-jessie.mjs';

import interpJessie from './interp-jessie.mjs';

function tagString(template, ...args) {
    const cooked = args.reduce((prior, hole, i) => {
        prior.push(template[i], String(hole));
        return prior;
    }, []);
    const tmpl = [cooked.join('')];
    tmpl.raw = args.reduce((prior, hole, i) => {
        prior.push(template.raw[i], String(hole));
        return prior;
    }, []);
    return tmpl;
}

function bootEnv(endowments, bootbnf, sc) {
    // Implement our bnf tag.
    const bnfTag = qBnf(bootbnf, sc);
    
    // Stack up the parser.
    const jsonTag = qJSON(bnfTag);
    const justinTag = qJustin(bnfTag.extends(jsonTag));
    const jessieTag = qJessie(bnfTag.extends(justinTag));

    const env = def({
        ...endowments,
        confine: (src, evalenv, options) => {
            const ast = jessieTag(tagString`${src}\n;`);
            return def(interpJessie(ast, evalenv, options || {}));
        },
        confineExpr: (src, evalenv, options) => {
            const ast = jessieTag(tagString`(${src}\n)`);
            return def((1,interpJessie).expr(ast, evalenv, options || {}));
        },
        eval: (src) => {
            const ast = jessieTag(tagString`${src}`);
            return def(interpJessie(ast, env));
        },
    });
    return env;
}

export default def(bootEnv);
