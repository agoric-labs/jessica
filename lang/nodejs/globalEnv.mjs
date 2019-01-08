// We set global variables to emulate a Jessie environment in a
// vanilla Node.js script.  This allows us to import modules directly
// if they are written in Jessie (as all the jessica/ directory is).
//
// NOTE: Don't ever do this in a library module, it's only allowed when
// we are a main program, and we're changing global state for the
// entire process.
import sesshim from './sesshim';

const harden = sesshim.def || sesshim.harden;

const globalEnv = {
    // Object factories (since operator new is not available).
    makeMap: harden((...args) => harden(new Map(...args))),
    makeSet: harden((...args) => harden(new Set(...args))),
    makePromise: harden((...args) => harden(new Promise(...args))),
    makeWeakMap: harden((...args) => harden(new WeakMap(...args))),
    makeWeakSet: harden((...args) => harden(new WeakSet(...args))),
};

// Export all of the SES shim.
for (const vname in sesshim) {
    const target = (vname === 'def') ? 'harden' : vname;
    globalEnv[target] = sesshim[vname];
}

// Export the environment as global endowments.  This is only possible
// because we are in control of the main program, and we are setting
// this policy for all our modules.
for (const vname in globalEnv) {
    global[vname] = globalEnv[vname];
}

export default globalEnv;
