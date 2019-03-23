// We set global variables to emulate a Jessie environment in a
// vanilla Node.js script.  This allows us to import modules directly
// if they are written in Jessie (as all the jessica/ directory is).
//
// NOTE: Don't ever do this in a library module, it's only allowed when
// we are a main program, and we're changing global state for the
// entire process.
/// <reference path="../../typings/ses.d.ts"/>
/// <reference path="node_modules/@types/node/ts3.1/index.d.ts"/>
import globalEnv from './globalEnv0.mjs';
globalEnv.makeMap = immunize((...args) => new Map(...args));
globalEnv.makeSet = immunize((...args) => new Set(...args));
globalEnv.makePromise = immunize((executor) => new Promise(executor));
globalEnv.makeWeakMap = immunize((...args) => new WeakMap(...args));
globalEnv.makeWeakSet = immunize((...args) => new WeakSet(...args));
Object.keys(globalEnv).forEach(vname => {
    global[vname] = globalEnv[vname];
});
// slog writes to console
import makeSlog from '../../lib/slog.mjs';
const startWs = /^\s+/;
const endWs = /\s+$/;
const contextArg = (context, a) => {
    if (typeof a !== 'object' || a === null) {
        // Just stringify the argument.
        return '' + a;
    }
    else if (a.length !== undefined) {
        // Take the value as the (anonymous) array.
        return a;
    }
    // Deconstruct the argument object.
    let valname, val;
    for (const vname of Object.keys(a)) {
        if (vname === 'format') {
            // format = a[vname];
        }
        else if (valname !== undefined || typeof a[vname] === 'function') {
            // Too many members or seems to be an active object.
            return a;
        }
        else {
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
    }
    else if (context.has(valname)) {
        const oval = context.get(valname);
        if (val !== oval) {
            slog.error `Context value ${{ valname }} mismatch: ${{ val }} vs. ${{ oval }}`;
        }
    }
    else {
        context.set(valname, val);
    }
    return val;
};
// Create a logger.
const mySlog = makeSlog((level, names, levels, context, template, args) => {
    let ca;
    const reduced = args.reduce((prior, a, i) => {
        ca = contextArg(context, a);
        const last = prior[prior.length - 1];
        if (typeof ca === 'object') {
            prior[prior.length - 1] = last.replace(endWs, '');
            prior.push(ca, template[i + 1].replace(startWs, ''));
        }
        else {
            prior[prior.length - 1] = last + String(ca) + template[i + 1];
        }
        return prior;
    }, [names[level] + ': ' + template[0]]);
    if (level >= levels.get('warn')) {
        // Use console.error to provide an inspectable result.
        console.error(...reduced);
    }
    else {
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
    }
    else if (level <= levels.get('panic')) {
        // At least allow turns to finish.
        process.exitCode = 99;
    }
    else if (level <= levels.get('error')) {
        // Throw an exception without revealing stack.
        throw reduced.join(' ');
    }
    return reduced.join(' ');
});
globalEnv.slog = mySlog;
// We need a `bond` implementation for Jessie to be usable
// within SES.
import makeBond from '../../lib/bond.mjs';
export const applyMethod = Object.freeze((boundThis, method, args) => method.apply(boundThis, args));
globalEnv.bond = makeBond(applyMethod);
export const setComputedIndex = Object.freeze((obj, index, val) => {
    if (index === '__proto__') {
        slog.error `Cannot set ${{ index }} object member`;
    }
    return obj[index] = val;
});
export const makeWrapper = Object.freeze((newImmunize, fn) => function wrapper(...args) {
    let ret;
    try {
        // Immunize arguments before calling.
        const iargs = args.map(immunize);
        ret = applyMethod(this, fn, iargs);
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
globalEnv.immunize = makeImmunize(makeHarden, makeWrapper, setComputedIndex);
// Export the environment as global endowments.  This is only possible
// because we are in control of the main program, and we are setting
// this policy for all our modules.
Object.keys(globalEnv).forEach(vname => {
    global[vname] = globalEnv[vname];
});
export default globalEnv;
