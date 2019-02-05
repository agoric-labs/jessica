#! /usr/bin/env -Snode --experimental-modules
// jesspipe.mjs - Evaluate a Jessie script as part of a pipeline
// Usage is:
// $ node --experimental-modules jesspipe.mjs \
//    MODULE [OPTIONS...] [-- [INFILE...]]

// The following endowments are added to mutableEnv:

import mutableEnv from './globalEnv.mjs';

// slog writes to console
import makeSlog from '../../lib/slog.mjs';
const startWs = /^\s+/;
const endWs = /\s+$/;
const contextArg = (context, a) => {
    if (typeof a !== 'object' || a === null) {
        // Just stringify the argument.
        return '' + a;
    }
    else if (a.length !== undefined) {
        // Take the value as the (anonymous) array.
        return a;
    }
    // Deconstruct the argument object.
    let format, val;
    Object.keys(a).forEach((vname) => {
        if (vname === 'format') {
            format = a[vname];
        }
        else if (val === undefined) {
            val = a[vname];
            if (context.has(vname)) {
                const oval = context.get(vname);
                if (val !== oval) {
                    throw Error(`Context value ${vname} mismatch: ${JSON.stringify(val)} vs. ${JSON.stringify(oval)}`);
                }
            }
            else {
                context.set(vname, val);
            }
        }
    });
    return val;
};

// Create a logger.
const slog = makeSlog(
    (level, names, levels, context, template, args) => {
        const reduced = args.reduce((prior, a, i) => {
            prior.push(contextArg(context, a), template[i + 1].replace(startWs, ''));
            return prior;
        }, [names[level] + ': ' + template[0].replace(endWs, '')]);
        if (level > levels.get('warn')) {
            console.error(...reduced);
        }
        else {
            // Record an location, too.
            const at = new Error('at:');
            console.error(...reduced, at);
        }
    },
    (map, obj) => {
        Object.keys(obj).forEach((v) => map.set(v, obj[v]));
    });

mutableEnv.slog = slog;
global.slog = slog;

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
const loadAsset = makeLoadAsset(CAN_LOAD_ASSETS, fs.readFile);

// Make a confined file writer.
const writeOutput = (fname, str) => {
    if (fname !== '-') {
        throw Error(`Cannot write to ${fname}: must be -`);
    }
    process.stdout.write(str);
};

// We need a `bond` implementation for Jessie to be usable
// within SES.
import makeBond from '../../lib/bond.mjs';
mutableEnv.bond = makeBond(
    (obj, index) => obj[index],
    (boundThis, method, args) => method.apply(boundThis, args));

// Create a Jessie bootstrap environment for the endowments.
import bootEnv from '../../lib/boot-env.mjs';
const Jessie = bootEnv(mutableEnv);

// We exit success if asked to.
if (Jessie === 'FIXME: Fake success') {
    console.error('FIXME: Would do something, other than boot');
    writeOutput('-', '/* FIXME: Stub */\n')
    process.exit(0);
}

// Read, eval, print loop.
import repl from '../../lib/repl.mjs';
const doEval = (src) => Jessie.confine(src, Jessie, {scriptName: MODULE});
repl(loadAsset(MODULE), doEval, (s) => writeOutput('-', s + '\n'), ARGV)
  .catch(e => {
      console.error(`Cannot evaluate ${JSON.stringify(MODULE)}: ${e}`);
      process.exit(1);
  });
