// We set global variables to emulate SES in a vanilla Node.js
// script.  This allows us to import modules directly if they are
// written in Jessie (as all the jessica/ directory is).
//
// NOTE: Don't ever do this in a library module, it's only allowed when
// we are a main program, and we're changing global state for the
// entire process.
import sesshim from './quasiParserGenerator/src/sesshim';
(function (global) {
    for (const vname in sesshim) {
        global[vname] = sesshim[vname];
    }
})(typeof global === 'undefined' ? window : global);
