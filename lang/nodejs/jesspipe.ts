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
const rawLoadAsset = (asset: string) =>
    makePromise<string>((resolve, reject) => {
        fs.readFile(asset, {encoding: 'latin1'}, function readCb(err: any, data: string) {
            slog.error`Reading got ${asset} ${data}`;
            if (err) {
                return reject(err);
            }
            return resolve(data);
        });
    });

const loadAsset = makeLoadAsset(CAN_LOAD_ASSETS, rawLoadAsset);

// Make a confined file writer.
const writeOutput = (fname: string, str: string) => {
    if (fname !== '-') {
        throw Error(`Cannot write to ${fname}: must be -`);
    }
    process.stdout.write(str);
};

// Create a Jessie bootstrap environment for the endowments.
import bootEnv from '../../lib/boot-env.mjs';
const jessie = bootEnv(mutableEnv);

// Read, eval, print loop.
import repl from '../../lib/repl.mjs';
const doEval = (src: string, uri?: string) =>
    jessie.confine(src, jessie, {scriptName: uri});
repl(MODULE, loadAsset, doEval, writeOutput, ARGV)
  .catch(e => {
      writeOutput('-', '/* FIXME: Stub */\n');
      slog.error`Cannot evaluate ${JSON.stringify(MODULE)}: ${e}`;
  });
