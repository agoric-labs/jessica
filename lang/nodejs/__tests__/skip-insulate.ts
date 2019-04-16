/// <reference path="../node_modules/@types/jest/index.d.ts"/>
import '../globalEnv.mjs';

import makeInsulate from '../../../lib/insulate.mjs';
import makeHarden from '../makeHardener.mjs';
const defaultInsulate = () => makeInsulate(
    (freeze) => makeHarden([], freeze),
    (obj, index, value) => { obj[index] = value; }
);

test('insulate(primitives)', () => {
    const insulate = defaultInsulate();
    expect(insulate('foo')).toBe('foo');
    expect(insulate(123)).toBe(123);
    expect(insulate(0.995)).toBe(0.995);
    expect(insulate(false)).toBe(false);
    expect(insulate(undefined)).toBe(undefined);
    expect(insulate(null)).toBe(null);
    expect(insulate((arg: number) => arg)(123)).toBe(123);
});

test('insulate(cache)', () => {
    const insulate = defaultInsulate();
    const f = (a: number, b: string) => b + a;
    expect(insulate(f)).not.toBe(f);
    expect(insulate(f)).toBe(insulate(f));
    expect(insulate(f)(123, 'str')).toBe(f(123, 'str'));
    const obj2 = {num: 123};
    const obj = {
        f() { return obj2; },
    };
    const io = insulate(obj);
    expect(io).not.toBe(obj);
    expect(io.f).not.toBe(obj.f);
    expect(io.f()).not.toBe(obj2);
    expect(io.f().num).toBe(obj2.num);
});
