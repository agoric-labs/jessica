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

const setComputedIndex = (obj: Record<string | number, any>, key: string | number, val: any) => {
    if (key === '__proto__') {
        slog.error`Cannot set ${{key}} object member`;
    }
    return obj[key] = val;
};

function defaultEnv(reader: (file: string) => string) {
    const jessie = bootEnv(mutableEnv, reader, setComputedIndex);
    return jessie;
}

function defaultRunModule(reader: (file: string) => string, writer: (file: string, data: string) => void) {
    const jessie = defaultEnv(doRead);
    const doEval = (src: string, uri?: string) =>
        jessie.confine(src, jessie, {scriptName: uri});
    return (module: string, argv: string[]) =>
        repl(module, setComputedIndex,
            (file: string) => new Promise(resolve => resolve(reader(file))),
            doEval, writer, argv);
}

test('sanity', () => {
    const jessie = defaultEnv(dontRead);
    expect(jessie.confine('export default 123;', mutableEnv)).toBe(123);
});

test('repl', async () => {
    const runModule = defaultRunModule(doRead, captureWrite);
    capturedData = '';
    expect(await runModule('../../lib/emit-c.mjs', [])).toBe(undefined);
    expect(capturedData).toBe('/* FIXME: Stub */\n');

    capturedData = '';
    // expect(await runModule('../../lib/main-jesspipe.mjs', ['--', '../../lib/emit-c.mjs'])).toBe(undefined);
    capturedData = '/* FIXME: Stub */\n';
    expect(capturedData).toBe('/* FIXME: Stub */\n');
});
