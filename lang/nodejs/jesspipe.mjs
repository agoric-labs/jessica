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
mutableEnv.loadAsset = makeLoadAsset(CAN_LOAD_ASSETS, fs);

// Create a Jessie bootstrap environment for the endowments.
import makeJessie from './makeJessie.mjs';
const Jessie = makeJessie(mutableEnv);

// Read, eval, print loop.
import repl from '../../lib/repl.mjs';
import globalEnv from './globalEnv.mjs';
repl(Jessie, (1,Jessie).loadAsset(MODULE))
  .catch(e => {throw Error(`Cannot evaluate ${JSON.stringify(MODULE)}: ${e}`)});
