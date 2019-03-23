/// <reference path="../node_modules/@types/jest/index.d.ts"/>
import mutableEnv from '../globalEnv.mjs';

import bootEnv from '../../../lib/boot-env.mjs';
import repl from '../../../lib/repl.mjs';

import * as fs from 'fs';

let capturedData = '';
const captureWrite = (file: string, data: string) => {
    capturedData += data;
};

function doRead(file: string) {
    return fs.readFileSync(file, { encoding: 'latin1' });
}

function dontRead(file: string): never {
    throw Error(`Refusing to read ${file}`);
}

const applyMethod = (boundThis: any, method: (...args: any[]) => any, args: any[]) =>
    method.apply(boundThis, args);

const setComputedIndex = (obj: Record<string | number, any>, key: string | number, val: any) => {
    if (key === '__proto__') {
        slog.error`Cannot set ${{key}} object member`;
    }
    return obj[key] = val;
};

function defaultEnv(reader: (file: string) => string) {
    const jessie = bootEnv(mutableEnv, applyMethod, reader, setComputedIndex);
    return jessie;
}

function defaultRunModule(reader: (file: string) => string, writer: (file: string, data: string) => void) {
    const jessie = defaultEnv(doRead);
    const doEval = (src: string, uri?: string) =>
        jessie.confine(src, jessie, {scriptName: uri});
    const deps = {applyMethod, readInput: reader, setComputedIndex, writeOutput: writer};
    return (module: string, argv: string[]) =>
        repl(deps, doEval, module, argv);
}

test('sanity', () => {
    const jessie = defaultEnv(dontRead);
    expect(jessie.confine('export default 123;', mutableEnv)).toBe(123);
});

test('repl', () => {
    const runModule = defaultRunModule(doRead, captureWrite);
    capturedData = '';
    expect(runModule('../../lib/emit-c.mjs', [])).toBe(undefined);
    expect(capturedData).toBe('/* FIXME: Stub */\n');

    if (false) {
        capturedData = '';
        expect(runModule('../../lib/main-jesspipe.mjs', ['--', '../../lib/emit-c.mjs'])).toBe(undefined);
        expect(capturedData).toBe('/* FIXME: Stub */\n');
    }
});
