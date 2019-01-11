#! /usr/bin/env -Snode --experimental-modules
// jesspipe.mjs - Evaluate a Jessie script as part of a pipeline
// Usage is:
// $ node --experimental-modules jesspipe.mjs \
//    MODULE [OPTIONS...] [-- [INFILE...]]

// The following endowments are added to mutableEnv:

import mutableEnv from './globalEnv.mjs';

// console.log for stdout, and console.error for stderr.
const oldConsole = console;
mutableEnv.console = harden({
    error: harden((...args) => oldConsole.error(...args)),
    log: harden((...args) => oldConsole.log(...args)),
});

// Read and evaluate the specified module,
if (process.argv.length < 3) {
    throw Error(`You must specify a MODULE`);
}
const MODULE = process.argv[2] || '-';
const ARGV = process.argv.slice(2);

// Make a confined file loader specified by the arguments.
const dashdash = ARGV.indexOf('--');
const CAN_LOAD_ASSETS = makeSet([MODULE]);
if (dashdash >= 0) {
    ARGV.slice(dashdash + 1).forEach(file => CAN_LOAD_ASSETS.add(file));
}

import fs from 'fs';
import makeLoadAsset from '../../lib/loadAsset.mjs';
mutableEnv.loadAsset = makeLoadAsset(CAN_LOAD_ASSETS, fs.readFile);

// We need a `bond` implementation for Jessie to be usable
// within a SES compartment.
import makeBond from '../../lib/bond.mjs';
mutableEnv.bond = makeBond(
    (obj, index) => obj[index],
    (boundThis, method, ...args) => method.call(boundThis, ...args));

// Create a Jessica bootstrap environment for the endowments.
import bootEnv from '../../lib/boot-env.mjs';
const Jessica = bootEnv(mutableEnv);

// We exit success if asked to.
if (Jessica === 'FIXME: Fake success') {
    console.error('FIXME: Would do something, other than boot');
    console.log('/* FIXME: Stub */');
    process.exit(0);
}

// Read, eval, print loop.
import repl from '../../lib/repl.mjs';
// FIXME: update the scriptName.
const doEval = (src) => Jessica.confine(src, Jessica, {scriptName: MODULE});
repl(doEval, Jessica.loadAsset(MODULE), ARGV)
  .catch(e => {
      console.error(`Cannot evaluate ${JSON.stringify(MODULE)}: ${e}`);
      process.exit(1);
  });
