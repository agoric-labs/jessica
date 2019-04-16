/// <reference path="../../typings/ses.d.ts"/>
/// <reference path="node_modules/@types/node/ts3.1/index.d.ts"/>
import makeInsulate from './insulate.mjs';
import sesshim from './sesshim.mjs';
const { confine, harden } = sesshim;
const globalEnv = {};
export const applyMethod = harden((thisObj, method, args) => method.apply(thisObj, args));
export const setComputedIndex = harden((obj, index, val) => {
    if (index === '__proto__') {
        slog.error `Cannot set ${{ index }} object member`;
    }
    return obj[index] = val;
});
globalEnv.makeMap = harden((...args) => harden(new Map(...args)));
globalEnv.makeSet = harden((...args) => harden(new Set(...args)));
globalEnv.makePromise = harden((executor) => harden(new Promise(executor)));
globalEnv.makeWeakMap = harden((...args) => harden(new WeakMap(...args)));
globalEnv.makeWeakSet = harden((...args) => harden(new WeakSet(...args)));
// Don't insulate the arguments to setComputedIndex or the primitive endowments.
const nonMapped = new WeakSet();
nonMapped.add(setComputedIndex);
export const insulate = makeInsulate(nonMapped);
// Needed by the parser.
globalEnv.confine = harden(confine);
globalEnv.insulate = (obj) => obj;
export default globalEnv;
