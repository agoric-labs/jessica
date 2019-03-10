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
globalEnv.makeMap = harden((...args) => harden(new Map(...args)));
globalEnv.makeSet = harden((...args) => harden(new Set(...args)));
globalEnv.makePromise = harden((executor) => harden(new Promise(executor)));
globalEnv.makeWeakMap = harden((...args) => harden(new WeakMap(...args)));
globalEnv.makeWeakSet = harden((...args) => harden(new WeakSet(...args)));
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
    if (level >= levels.get('warn') || ca instanceof Error) {
        // Use console.error to provide an inspectable result.
        console.error(...reduced);
    }
    else {
        // Record a location, too.
        const at = new Error('at:');
        console.error(...reduced, at);
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
globalEnv.bond = makeBond((boundThis, method, args) => method.apply(boundThis, args));
// Export the environment as global endowments.  This is only possible
// because we are in control of the main program, and we are setting
// this policy for all our modules.
Object.keys(globalEnv).forEach(vname => {
    global[vname] = globalEnv[vname];
});
export default globalEnv;
