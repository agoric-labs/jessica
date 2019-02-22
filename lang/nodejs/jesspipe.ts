#! /usr/bin/env ts-node
// jesspipe.ts - Evaluate a Jessie script as part of a pipeline
// Usage is:
// $ ts-node jesspipe.ts \
//    MODULE [OPTIONS...] [-- [INFILE...]]

import mutableEnv from './globalEnv.mjs';

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

import * as fs from 'fs';
import makeLoadAsset from '../../lib/loadAsset.mjs';
const loadAsset = makeLoadAsset(CAN_LOAD_ASSETS, fs.readFile);

// Make a confined file writer.
const writeOutput = (fname, str) => {
    if (fname !== '-') {
        throw Error(`Cannot write to ${fname}: must be -`);
    }
    process.stdout.write(str);
};

// Create a Jessie bootstrap environment for the endowments.
import bootEnv from '../../lib/boot-env.mjs';
const Jessie = bootEnv(mutableEnv);

// Read, eval, print loop.
import repl from '../../lib/repl.mjs';
const doEval = (src) => Jessie.confine(src, Jessie, {scriptName: MODULE});
repl(loadAsset(MODULE), doEval, (s) => writeOutput('-', s + '\n'), ARGV)
  .catch(e => {
      writeOutput('-', '/* FIXME: Stub */\n');
      slog.error`Cannot evaluate ${JSON.stringify(MODULE)}: ${e}`;
  });
