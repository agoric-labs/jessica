/// <reference path="../node_modules/@types/jest/index.d.ts"/>
import {insulate} from '@agoric/jessie';
import {applyMethod, setComputedIndex} from '../jessieDefaults.js';

import bootJessica from '../../../lib/boot-jessica.js';
import repl from '../../../lib/repl.js';

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

function defaultJessica(reader: (file: string) => string) {
    const jessica = bootJessica(applyMethod, reader, setComputedIndex);
    return jessica;
}

function defaultRunModule(reader: (file: string) => string, writer: (file: string, data: string) => void) {
    const jessica = defaultJessica(doRead);
    const doEval = (src: string, uri?: string) =>
        jessica.runModule(src, {}, {scriptName: uri});
    const deps = {applyMethod, readInput: reader, setComputedIndex, writeOutput: writer};
    return (module: string, argv: string[]) =>
        repl(deps, doEval, module, argv);
}

test('sanity', () => {
    const jessica = defaultJessica(dontRead);
    expect(jessica.runModule('export default 123;')).toBe(123);
});

test('repl', () => {
    const runModule = defaultRunModule(doRead, captureWrite);
    capturedData = '';
    expect(runModule('../../lib/emit-c.js', [])).toBe(undefined);
    expect(capturedData).toBe('/* FIXME: Stub */\n');

    if (false) {
        capturedData = '';
        expect(runModule('../../lib/main-jesspipe.js', ['--', '../../lib/emit-c.js'])).toBe(undefined);
        expect(capturedData).toBe('/* FIXME: Stub */\n');
    }
});

test('quasi', () => {
    const jessica = defaultJessica(dontRead);
    const runModule = (src: string) => jessica.runModule(src, {insulate});
    const tag = (template: TemplateStringsArray, ...args: any[]) =>
        args.reduce((prior, arg, i) => prior + String(arg) + template[i + 1], template[0]);

    expect(runModule('export default insulate(() => `abc 123`);')())
        .toBe('abc 123');

    expect(runModule('export default insulate((arg) => `abc ${arg} 456`);')(123))
        .toBe('abc 123 456');

    expect(runModule('export default insulate((tag) => tag`My string`);')(tag))
        .toBe('My string');

    expect(runModule('export default insulate((tag, arg) => tag`My template ${arg}`);')(tag, 'hello'))
        .toBe('My template hello');

});
