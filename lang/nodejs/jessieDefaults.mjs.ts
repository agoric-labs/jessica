/// <reference path="../../typings/ses.d.ts"/>
/// <reference path="node_modules/@types/node/ts3.1/index.d.ts"/>

import sesshim from './sesshim.mjs';

const {confine, harden} = sesshim;

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

export const makeWrapper = Object.freeze((newInsulate: typeof insulate, fn: (...args: any[]) => any) =>
    function wrapper(...args: any[]) {
        let ret: any;
        try {
            // Insulate `this` and arguments before calling.
            const iargs = args.map(newInsulate);
            const ithis = newInsulate(this);
            ret = fn.apply(ithis, iargs);
        } catch (e) {
            // Insulate exception, and rethrow.
            throw newInsulate(e);
        }
        // Insulate return value.
        return newInsulate(ret);
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

import makeInsulate from '../../lib/insulate.mjs';
if (typeof window === 'undefined') {
    // Need to bootstrap makeInsulate.
    (global as any).makeWeakMap = Object.freeze((...args: any[]) => Object.freeze(new WeakMap(...args)));
    const insulate = makeInsulate(makeHarden, makeWrapper, setComputedIndex);
    globalEnv.insulate = insulate;
} else {
    // FIXME: Until we figure out how to run under SES.
    globalEnv.insulate = harden;
}

globalEnv.makeMap = insulate((...args: any[]) => new Map(...args));
globalEnv.makeSet = insulate((...args: any[]) => new Set(...args));
globalEnv.makePromise = insulate((executor: any) => new Promise(executor));
globalEnv.makeWeakMap = insulate((...args: any[]) => new WeakMap(...args));
globalEnv.makeWeakSet = insulate((...args: any[]) => new WeakSet(...args));

export default globalEnv;
