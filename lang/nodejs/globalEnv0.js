// We set global variables to emulate a Jessie environment in a
// vanilla Node.js script.  This allows us to import modules directly
// if they are written in Jessie (as all the jessica/ directory is).
//
// NOTE: Don't ever do this in a library module, it's only allowed when
// we are a main program, and we're changing global state for the
// entire process.
/// <reference path="../../typings/ses.d.ts"/>
const sesshim = require('./sesshim');
const globalEnv = {};
// Export all of the SES shim.
for (const vname in sesshim) {
    const target = (vname === 'def') ? 'harden' : vname;
    globalEnv[target] = sesshim[vname];
    global[target] = sesshim[vname];
}
globalEnv.makeError = harden((...args) => harden(new Error(...args)));
globalEnv.makeMap = harden((...args) => harden(new Map(...args)));
globalEnv.makeSet = harden((...args) => harden(new Set(...args)));
globalEnv.makePromise = harden((executor) => harden(new Promise(executor)));
globalEnv.makeWeakMap = harden((...args) => harden(new WeakMap(...args)));
globalEnv.makeWeakSet = harden((...args) => harden(new WeakSet(...args)));
Object.keys(globalEnv).forEach(vname => {
    global[vname] = globalEnv[vname];
});

module.export = globalEnv;
