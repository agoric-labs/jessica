#! /usr/bin/env ts-node
// jesspipe.ts - Evaluate a Jessie script as part of a pipeline
// Usage is:
// $ ts-node jesspipe.ts \
//    MODULE [OPTIONS...] [-- [INFILE...]]

/// <reference path="../../typings/ses.d.ts"/>
/// <reference path="node_modules/@types/node/ts3.1/index.d.ts"/>

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
import makeReadInput from '../../lib/readInput.mjs';
const rawReadInput = (asset: string) =>
    makePromise<string>((resolve, reject) => {
        fs.readFile(asset, {encoding: 'latin1'}, function readCb(err: any, data: string) {
            if (err) {
                return reject(err);
            }
            return resolve(data);
        });
    });

const readInput = makeReadInput(CAN_LOAD_ASSETS, rawReadInput);

// Make a confined file writer.
const writeOutput = (fname: string, str: string) => {
    if (fname !== '-') {
        throw makeError(`Cannot write to ${fname}: must be -`);
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
repl(MODULE, readInput, doEval, writeOutput, ARGV)
    .catch(e => {
        writeOutput('-', '/* FIXME: Stub */\n');
        try {
            e.stack = e.stack.replace(/\(data:(.{20}).*\)$/mg, '(data:$1...)');
        } catch (e2) {
            // Do nothing.
        }
        slog.error`Cannot evaluate ${JSON.stringify(MODULE)}: ${e}`;
    });
