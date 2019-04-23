// We set global variables to emulate a Jessie environment in a
// vanilla Node.js script.  This allows us to import modules directly
// if they are written in Jessie (as all the jessica/ directory is).
//
// NOTE: Don't ever do this in a library module, it's only allowed when
// we are a main program, and we're changing global state for the
// entire process.
/// <reference path="../../typings/ses.d.ts"/>
/// <reference path="node_modules/@types/node/ts3.1/index.d.ts"/>
import primEnv from './jessieDefaults.mjs';
export * from './jessieDefaults.mjs';
const globalEnv = Object.assign({}, primEnv);
// Export the bootstrapped primitives.
Object.keys(globalEnv).forEach(vname => {
    global[vname] = globalEnv[vname];
});
// slog writes to console
import makeSlog, { contextArg } from '../../lib/slog.mjs';
// Create a logger.
const mySlog = makeSlog((level, names, levels, context, template, args) => {
    let ca;
    const reduced = args.reduce((prior, a, i) => {
        ca = contextArg(context, a);
        const last = prior[prior.length - 1];
        if (typeof ca === 'object' && ca !== undefined) {
            prior[prior.length - 1] = last.trimRight();
            prior.push(ca, template[i + 1].trimLeft());
        }
        else {
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
    else if (typeof global !== 'undefined' && level <= levels.get('panic')) {
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
// Export the environment as global endowments.  This is only possible
// because we are in control of the main program, and we are setting
// this policy for all our modules.
const globals = typeof window === 'undefined' ? global : window;
Object.keys(globalEnv).forEach(vname => {
    globals[vname] = globalEnv[vname];
});
export default globalEnv;
