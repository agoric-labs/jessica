// These are exported explicitly below.
/// <reference path="../typings/jessie-proposed.d.ts"/>
import { harden, insulate as rawInsulate, makeMap, makePromise,
    makeSet, makeWeakMap, makeWeakSet } from '@agoric/jessie';
import { slog } from '@michaelfig/slog';

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

    // No, this isn't an empty Map.
    // (It's initialized after jessica.runExpr is defined.)
    const importCache = makeMap<string, any>();
    const importer = makeImporter(importCache, readInput, jessieTag);
    const interpJessie = makeInterp(jessieEvaluators, applyMethod, importer, setComputedIndex);

    const jessica = {
        eval: (src: string): any => {
            // Don't inherit any endowments.
            return jessica.runExpr(src, {});
        },
        runExpr: (src: string, env: Record<string, any> = {}, options: ConfineOptions = {}) => {
            let tag = tagString<any[]>(jessieExprTag, options.scriptName);
            if (options.debug) {
                tag = tag('DEBUG');
            }
            const ast = tag`${src}`;
            const evalenv = {eval: jessica.eval, ...env};
            return interpJessie(ast, evalenv, options || {});
        },
        runModule: (src: string, env: Record<string, any> = {}, options: ConfineOptions = {}) => {
            let tag = tagString<any[]>(jessieTag, options.scriptName);
            if (options.debug) {
                tag = tag('DEBUG');
            }
            const ast = tag`${src}`;
            const evalenv = {eval: jessica.eval, ...env};
            return interpJessie(ast, evalenv, options || {}).default;
        },
    };

    // Only allow the Jessie library we know about, with a self-hosted
    // confine and confineExpr.
    const jessie = harden({
        confine(src: string, env: Record<string, any>, options: ConfineOptions = {}) {
            // Evaluate as an IIFE, but return nothing.
            jessica.runExpr(`(()=>{${src}
;})()`, env, options);
        },
        confineExpr: jessica.runExpr,
        harden,
        insulate<T>(warmTarget: T) {
            // Don't insulate our existing targets.
            if (jessieTargets.has(warmTarget)) {
                return warmTarget;
            }
            return rawInsulate(warmTarget);
        },
        makeMap,
        makePromise,
        makeSet,
        makeWeakMap,
        makeWeakSet,
    });
    const jessieTargets = makeSet(Object.values(jessie));
    importCache.set('@agoric/jessie', harden(jessie));

    // The default slog is also allowed.
    importCache.set('@michaelfig/slog', Object.freeze({slog}));
    return jessica;
};

export default bootJessica;
