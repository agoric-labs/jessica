// We set global variables to emulate a Jessie environment in a
// vanilla Node.js script.  This allows us to import modules directly
// if they are written in Jessie (as all the jessica/ directory is).
//
// NOTE: Don't ever do this in a library module, it's only allowed when
// we are a main program, and we're changing global state for the
// entire process.

/// <reference path="../../typings/ses.d.ts"/>
/// <reference path="node_modules/@types/node/ts3.1/index.d.ts"/>

import './sesshim.mjs';

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
// Need makeWeakMap for makeImmunize.
(global as any).makeWeakMap = Object.freeze((...args: any[]) => Object.freeze(new WeakMap(...args)));
const immunize = makeImmunize(makeHarden, makeWrapper, setComputedIndex);

globalEnv.immunize = immunize;
globalEnv.makeMap = immunize((...args: any[]) => new Map(...args));
globalEnv.makeSet = immunize((...args: any[]) => new Set(...args));
globalEnv.makePromise = immunize((executor: any) => new Promise(executor));
globalEnv.makeWeakMap = immunize((...args: any[]) => new WeakMap(...args));
globalEnv.makeWeakSet = immunize((...args: any[]) => new WeakSet(...args));

// Export the bootstrapped primitives.
Object.keys(globalEnv).forEach(vname => {
    (global as Record<string, any>)[vname] = globalEnv[vname];
});

// slog writes to console
import makeSlog from '../../lib/slog.mjs';
const contextArg = (context: Map<string, any>, a: any) => {
    if (typeof a !== 'object' || a === null) {
        // Just stringify the argument.
        return '' + a;
    } else if (a.length !== undefined) {
        // Take the value as the (anonymous) array.
        return a;
    }
    // Deconstruct the argument object.
    let valname: string, val: any;
    for (const vname of Object.keys(a)) {
        if (vname === 'format') {
            // format = a[vname];
        } else if (valname !== undefined || typeof a[vname] === 'function') {
            // Too many members or seems to be an active object.
            return a;
        } else {
            // We have at least one non-format member.
            valname = vname;
            val = JSON.stringify(a[vname], undefined, 2);
        }
    }

    if (valname === undefined) {
        // No non-format arguments.
        return a;
    }

    if (valname[0] === '_') {
        // Do nothing.
    } else if (context.has(valname)) {
        const oval = context.get(valname);
        if (val !== oval) {
            slog.error`Context value ${{valname}} mismatch: ${{val}} vs. ${{oval}}`;
        }
    } else {
        context.set(valname, val);
    }
    return val;
};

// Create a logger.
const mySlog = makeSlog(
    (level, names, levels, context, template, args) => {
        let ca: {};
        const reduced = args.reduce((prior, a, i) => {
            ca = contextArg(context, a);
            const last = prior[prior.length - 1];
            if (typeof ca === 'object' && ca !== undefined) {
                prior[prior.length - 1] = last.trimRight();
                prior.push(ca, template[i + 1].trimLeft());
            } else {
                prior[prior.length - 1] = last + String(ca) + template[i + 1];
            }
            return prior;
        }, [names[level] + ': ' + template[0]]);

        if (level === levels.get('stringify')) {
            // Just stringify.
            return reduced.join(' ');
        }
        if (level >= levels.get('warn')) {
            // Use console.error to provide an inspectable result.
            console.error(...reduced);
        } else {
            // Record a location, too.
            const at0 = new Error().stack;
            // Remove the current entry and our parent.
            const at1 = at0.slice(at0.indexOf('\n') + 1);
            const at2 = at1.slice(at1.indexOf('\n') + 1);
            const at3 = at2.slice(at2.indexOf('\n'));
            console.error(...reduced, at3);
        }
        if (names[level] === 'reject') {
            // Just return a promise rejection.
            return Promise.reject(reduced.join(' '));
        } else if (typeof global !== 'undefined' && level <= levels.get('panic')) {
            // At least allow turns to finish.
            process.exitCode = 99;
        } else if (level <= levels.get('error')) {
            // Throw an exception without revealing stack.
            throw reduced.join(' ');
        }
        return reduced.join(' ');
    });
globalEnv.slog = mySlog;

// Export the environment as global endowments.  This is only possible
// because we are in control of the main program, and we are setting
// this policy for all our modules.
Object.keys(globalEnv).forEach(vname => {
    (global as Record<string, any>)[vname] = globalEnv[vname];
});

export default globalEnv;
