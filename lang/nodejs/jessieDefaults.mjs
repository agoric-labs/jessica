/// <reference path="../../typings/ses.d.ts"/>
/// <reference path="node_modules/@types/node/ts3.1/index.d.ts"/>
import sesshim from './sesshim.mjs';
const { confine, harden } = sesshim;
const globalEnv = {};
globalEnv.confine = confine;
export const applyMethod = Object.freeze((thisObj, method, args) => method.apply(thisObj, args));
export const setComputedIndex = Object.freeze((obj, index, val) => {
    if (index === '__proto__') {
        slog.error `Cannot set ${{ index }} object member`;
    }
    return obj[index] = val;
});
export const makeWrapper = Object.freeze((newInsulate, fn) => function wrapper(...args) {
    let ret;
    try {
        // Insulate `this` and arguments before calling.
        const iargs = args.map(newInsulate);
        const ithis = newInsulate(this);
        ret = fn.apply(ithis, iargs);
    }
    catch (e) {
        // Insulate exception, and rethrow.
        throw newInsulate(e);
    }
    // Insulate return value.
    return newInsulate(ret);
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
import makeInsulate from '../../lib/insulate.mjs';
if (typeof window === 'undefined') {
    // Need to bootstrap makeInsulate.
    global.makeWeakMap = Object.freeze((...args) => Object.freeze(new WeakMap(...args)));
    const insulate = makeInsulate(makeHarden, makeWrapper, setComputedIndex);
    globalEnv.insulate = insulate;
}
else {
    // FIXME: Until we figure out how to run under SES.
    globalEnv.insulate = harden;
}
globalEnv.makeMap = insulate((...args) => new Map(...args));
globalEnv.makeSet = insulate((...args) => new Set(...args));
globalEnv.makePromise = insulate((executor) => new Promise(executor));
globalEnv.makeWeakMap = insulate((...args) => new WeakMap(...args));
globalEnv.makeWeakSet = insulate((...args) => new WeakSet(...args));
export default globalEnv;
