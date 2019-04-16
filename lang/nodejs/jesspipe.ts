#! /usr/bin/env ts-node
// jesspipe.ts - Evaluate a Jessie script as part of a pipeline
// Usage is:
// $ ts-node jesspipe.ts \
//    MODULE [OPTIONS...] [-- [INFILE...]]

/// <reference path="../../typings/jessie-proposed.d.ts"/>
/// <reference path="node_modules/@types/node/ts3.1/index.d.ts"/>

import globalEnv, {applyMethod, insulate, setComputedIndex} from './globalEnv.mjs';

// Read and evaluate the specified module,
if (process.argv.length < 3) {
    slog.panic`You must specify a MODULE`;
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
const rawReadInput = (path: string) => fs.readFileSync(path, {encoding: 'latin1'});

const readInput = makeReadInput(CAN_LOAD_ASSETS, rawReadInput);

// Make a confined file writer.
let written = false;
const writeOutput = (fname: string, str: string) => {
    if (fname !== '-') {
        slog.error`Cannot write to ${{fname}}: must be -`;
    }
    written = true;
    process.stdout.write(str);
};

// Create a Jessie bootstrap environment for the endowments.
import bootEnv from '../../lib/boot-env.mjs';
const jessie = bootEnv(globalEnv, applyMethod, readInput, setComputedIndex);

// Read, eval, print loop.
import repl from '../../lib/repl.mjs';
const doEval = (src: string, uri?: string) =>
    jessie.confine(src, {...jessie, insulate}, {scriptName: uri});
const deps = {applyMethod, readInput, setComputedIndex, writeOutput};
try {
    repl(deps, doEval, MODULE, ARGV);
} catch (e) {
    if (!written) {
        writeOutput('-', `/* FIXME: Stub */\n`);
    }
    slog.notice`Cannot evaluate ${{MODULE}}: ${e}`;
}
