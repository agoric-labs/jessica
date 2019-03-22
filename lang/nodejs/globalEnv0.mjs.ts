// We set global variables to emulate a Jessie environment in a
// vanilla Node.js script.  This allows us to import modules directly
// if they are written in Jessie (as all the jessica/ directory is).
//
// NOTE: Don't ever do this in a library module, it's only allowed when
// we are a main program, and we're changing global state for the
// entire process.

import * as sesshim from './sesshim.js';

const globalEnv: Record<string, any> = {};

// Export parts of the SES shim.
globalEnv.immunize = sesshim.def;
globalEnv.confine = sesshim.confine;

// Bootstrap one-argument bond.
globalEnv.bond = (fn: (...args: any[]) => any) =>
    (...args: any[]) => fn.apply(undefined, args.map(immunize));

(global as any).immunize = globalEnv.immunize;
(global as any).confine = globalEnv.confine;
(global as any).bond = globalEnv.bond;

export default globalEnv;
