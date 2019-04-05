/// <reference path="../../typings/ses.d.ts"/>
/// <reference path="node_modules/@types/node/ts3.1/index.d.ts"/>
import sesshim from './sesshim.mjs';
const { confine } = sesshim;
const globalEnv = {};
globalEnv.confine = confine;
export const applyMethod = Object.freeze((thisObj, method, args) => method.apply(thisObj, args));
export const setComputedIndex = Object.freeze((obj, index, val) => {
    if (index === '__proto__') {
        slog.error `Cannot set ${{ index }} object member`;
    }
    return obj[index] = val;
});
export const makeWrapper = Object.freeze((newImmunize, fn) => function wrapper(...args) {
    let ret;
    try {
        // Immunize `this` and arguments before calling.
        const iargs = args.map(newImmunize);
        const ithis = newImmunize(this);
        ret = fn.apply(ithis, iargs);
    }
    catch (e) {
        // Immunize exception, and rethrow.
        throw newImmunize(e);
    }
    // Immunize return value.
    return newImmunize(ret);
});
// TODO: Need to use @agoric/make-hardener.
const makeHarden = (prepareObject) => {
    const hardMap = new WeakMap();
    // FIXME: Needed for bootstrap.
    hardMap.set(setComputedIndex, setComputedIndex);
    if (typeof window !== 'undefined') {
        hardMap.set(window, window);
    }
    function newHarden(root) {
        if (root === null) {
            return root;
        }
        const type = typeof root;
        if (type !== 'object' && type !== 'function') {
            return root;
        }
        if (hardMap.has(root)) {
            return hardMap.get(root);
        }
        prepareObject(root);
        const frozen = Object.freeze(root);
        hardMap.set(root, frozen);
        for (const value of Object.values(root)) {
            newHarden(value);
        }
        return frozen;
    }
    return newHarden;
};
import makeImmunize from '../../lib/immunize.mjs';
// Need to bootstrap makeImmunize.
global.makeWeakMap = Object.freeze((...args) => Object.freeze(new WeakMap(...args)));
const immunize = makeImmunize(makeHarden, makeWrapper, setComputedIndex);
globalEnv.immunize = immunize;
globalEnv.makeMap = immunize((...args) => new Map(...args));
globalEnv.makeSet = immunize((...args) => new Set(...args));
globalEnv.makePromise = immunize((executor) => new Promise(executor));
globalEnv.makeWeakMap = immunize((...args) => new WeakMap(...args));
globalEnv.makeWeakSet = immunize((...args) => new WeakSet(...args));
export default globalEnv;
