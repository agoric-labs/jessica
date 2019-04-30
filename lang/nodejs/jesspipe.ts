#! /usr/bin/env ts-node
// jesspipe.ts - Evaluate a Jessie script as part of a pipeline
// Usage is:
// $ ts-node jesspipe.ts \
//    MODULE [OPTIONS...] [-- [INFILE...]]

/// <reference path="../../typings/jessie-proposed.d.ts"/>
/// <reference path="node_modules/@types/node/ts3.1/index.d.ts"/>

import { insulate } from '@agoric/jessie';
import { slog } from '@michaelfig/slog';
import { applyMethod, setComputedIndex } from './jessieDefaults.mjs';

// Read and evaluate the specified module,
if (process.argv.length < 3) {
    slog.panic`You must specify a MODULE`;
}
const MODULE = process.argv[2] || '-';
const ARGV = process.argv.slice(2);

// Make a confined file loader specified by the arguments.
const dashdash = ARGV.indexOf('--');
const CAN_LOAD_ASSETS = new Set([MODULE]);
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

// Create a Jessica bootstrap interpreter.
import bootJessica from '../../lib/boot-jessica.mjs';
const jessica = bootJessica(applyMethod, readInput, setComputedIndex);

// Read, eval, print loop.
import repl from '../../lib/repl.mjs';
const runModule = (src: string, uri?: string) =>
    jessica.runModule(src, {eval: jessica.eval}, {scriptName: uri});
const deps = {applyMethod, readInput, setComputedIndex, writeOutput};
try {
    repl(deps, runModule, MODULE, ARGV);
} catch (e) {
    if (!written) {
        writeOutput('-', `/* FIXME: Stub */\n`);
    }
    slog.notice`Cannot evaluate ${{MODULE}}: ${e}`;
}
