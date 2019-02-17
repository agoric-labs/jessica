import bootPeg from './boot-peg.mjs';
import bootPegAst from './boot-pegast.mjs';
import makePeg from './quasi-peg.mjs';
import makeJSON from './quasi-json.mjs';
import makeJustin from './quasi-justin.mjs';
import makeJessie from './quasi-jessie.mjs';

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

function bootEnv(endowments) {
    // Bootstrap a peg tag.
    const pegTag = bootPeg(makePeg, bootPegAst);

    // Stack up the parser.
    const jsonTag = makeJSON(pegTag);
    const justinTag = makeJustin(pegTag.extends(jsonTag));
    const jessieTag = makeJessie(pegTag.extends(justinTag));

    console.error('JSONTAG!!!!');
    console.error(jsonTag.Parser.rule_primaryExpr, justinTag.Parser.rule_primaryExpr);
    console.error(justinTag(tagString`{"abc": 123} `));

    // FIXME: Fix the environments below.
    return 'FIXME: Fake success';
    const env = harden({
        ...endowments,
        confine: (src, evalenv, options) => {
            const ast = jessieTag(tagString`${src + '\n;'}`);
            return harden(interpJessie(ast, evalenv, options || {}));
        },
        confineExpr: (src, evalenv, options) => {
            const ast = jessieTag(tagString`${'(' + src + '\n)'}`);
            return harden(interpJessie.expr(ast, evalenv, options || {}));
        },
        eval: (src) => {
            const ast = jessieTag(tagString`${src}`);
            return harden(interpJessie(ast, env));
        },
    });
    return env;
}

export default harden(bootEnv);
