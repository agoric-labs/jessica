import bootPeg from './boot-peg.mjs';
import handParsedPeg from './hand-peg.mjs';
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
    const {bootPegTag, metaCompile} = bootPeg(makePeg, handParsedPeg);

    // Recreate a "peg" tag using the boostrap peg.
    const pegTag = makePeg(bootPegTag, metaCompile);

    // Compare our pegTag output to parsedPeg, to help ensure it is
    // correct.  This doesn't defend against a malicious bootPeg,
    // but it does prevent silly mistakes.
    const reparsedPeg = makePeg(pegTag, (...defs) => defs);
    const a = JSON.stringify(handParsedPeg, undefined, '  ');
    const b = JSON.stringify(reparsedPeg, undefined, '  ');
    if (a !== b) {
        console.error(`=== handParsedPeg
${a}
=== reparsedPeg
${b}
===`);
        throw `FATAL: handParsedPeg does not match reparsedPeg`;
    }

    // Stack up the parser.
    const jsonTag = makeJSON(pegTag);
    const justinTag = makeJustin(pegTag.extends(jsonTag));
    const jessieTag = makeJessie(pegTag.extends(justinTag));

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
