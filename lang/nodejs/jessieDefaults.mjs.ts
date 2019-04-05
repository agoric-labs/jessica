/// <reference path="../../typings/ses.d.ts"/>
/// <reference path="node_modules/@types/node/ts3.1/index.d.ts"/>

import sesshim from './sesshim.mjs';

const {confine} = sesshim;

const globalEnv: Record<string, any> = {};
globalEnv.confine = confine;

export const applyMethod = Object.freeze(<T>(thisObj: any, method: (...args: any) => T, args: any[]): T =>
    method.apply(thisObj, args));

export const setComputedIndex = Object.freeze(<T>(obj: any, index: string | number, val: T) => {
    if (index === '__proto__') {
        slog.error`Cannot set ${{index}} object member`;
    }
    return obj[index] = val;
});

export const makeWrapper = Object.freeze((newImmunize: typeof immunize, fn: (...args: any[]) => any) =>
    function wrapper(...args: any[]) {
        let ret: any;
        try {
            // Immunize `this` and arguments before calling.
            const iargs = args.map(newImmunize);
            const ithis = newImmunize(this);
            ret = fn.apply(ithis, iargs);
        } catch (e) {
            // Immunize exception, and rethrow.
            throw newImmunize(e);
        }
        // Immunize return value.
        return newImmunize(ret);
    });

// TODO: Need to use @agoric/make-hardener.
const makeHarden = (prepareObject: (obj: any) => void) => {
    const hardMap = new WeakMap<any, Hardened<any>>();
    // FIXME: Needed for bootstrap.
    hardMap.set(setComputedIndex, setComputedIndex);
    if (typeof window !== 'undefined') {
        hardMap.set(window, window);
    }
    function newHarden<T>(root: T): Hardened<T> {
        if (root === null) {
            return root as Hardened<null>;
        }
        const type = typeof root;
        if (type !== 'object' && type !== 'function') {
            return root as Hardened<typeof root>;
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
        return frozen as Hardened<T>;
    }
    return newHarden;
};

import makeImmunize from '../../lib/immunize.mjs';
// Need to bootstrap makeImmunize.
(global as any).makeWeakMap = Object.freeze((...args: any[]) => Object.freeze(new WeakMap(...args)));
const immunize = makeImmunize(makeHarden, makeWrapper, setComputedIndex);

globalEnv.immunize = immunize;
globalEnv.makeMap = immunize((...args: any[]) => new Map(...args));
globalEnv.makeSet = immunize((...args: any[]) => new Set(...args));
globalEnv.makePromise = immunize((executor: any) => new Promise(executor));
globalEnv.makeWeakMap = immunize((...args: any[]) => new WeakMap(...args));
globalEnv.makeWeakSet = immunize((...args: any[]) => new WeakSet(...args));

export default globalEnv;
