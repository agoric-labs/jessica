// We set global variables to emulate a Jessie environment in a
// vanilla Node.js script.  This allows us to import modules directly
// if they are written in Jessie (as all the jessica/ directory is).
//
// NOTE: Don't ever do this in a library module, it's only allowed when
// we are a main program, and we're changing global state for the
// entire process.

// Most of the work is already done by globalEnv0.js.
const globalEnv: Record<string, any> = {};

// slog writes to console
import makeSlog from '../../lib/slog.mjs';
const startWs = /^\s+/;
const endWs = /\s+$/;
const contextArg = (context, a) => {
    if (typeof a !== 'object' || a === null) {
        // Just stringify the argument.
        return '' + a;
    } else if (a.length !== undefined) {
        // Take the value as the (anonymous) array.
        return a;
    }
    // Deconstruct the argument object.
    let format, valname, val;
    for (const vname of Object.keys(a)) {
        if (vname === 'format') {
            format = a[vname];
        } else if (valname !== undefined || typeof a[vname] === 'function') {
            // Too many members or seems to be an active object.
            return a;
        } else {
            // We have at least one non-format member.
            valname = vname;
            val = a[vname];
        }
    }

    if (valname === undefined) {
        // No non-format arguments.
        return a;
    }

    if (context.has(valname)) {
        const oval = context.get(valname);
        if (val !== oval) {
            throw Error(`Context value ${valname} mismatch: ${JSON.stringify(val)} vs. ${JSON.stringify(oval)}`);
        }
    } else {
        context.set(valname, val);
    }
    return val;
};

// Create a logger.
const mySlog = makeSlog(
    (level, names, levels, context, template, args) => {
        let ca;
        const reduced = args.reduce((prior, a, i) => {
            ca = contextArg(context, a);
            if (typeof ca === 'object') {
                prior.push(ca, template[i + 1].replace(startWs, ''));
            } else {
                const last = prior[prior.length - 1];
                prior[prior.length - 1] = last + String(ca) + template[i + 1];
            }
            return prior;
        }, [names[level] + ': ' + template[0].replace(endWs, '')]);

        if (level > levels.get('warn') || ca instanceof Error) {
            console.error(...reduced);
        } else {
            // Record a location, too.
            const at = new Error('at:');
            console.error(...reduced, at);
        }
        if (level <= levels.get('panic')) {
            // At least allow turns to finish.
            process.exitCode = 99;
        }
    },
    (map, obj) => {
        Object.keys(obj).forEach((v) => map.set(v, obj[v]));
    });
globalEnv.slog = mySlog;

// We need a `bond` implementation for Jessie to be usable
// within SES.
import makeBond from '../../lib/bond.mjs';
globalEnv.bond = makeBond(
    (obj, index) => obj[index],
    (boundThis, method, args) => method.apply(boundThis, args));

// Export the environment as global endowments.  This is only possible
// because we are in control of the main program, and we are setting
// this policy for all our modules.
Object.keys(globalEnv).forEach(vname => {
    global[vname] = globalEnv[vname];
});

export default globalEnv;
