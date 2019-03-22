/// <reference path="../node_modules/@types/jest/index.d.ts"/>
import '../globalEnv.mjs';

import makeImmunize from '../../../lib/immunize.mjs';
import makeHarden from '../makeHardener.mjs';
const defaultImmunize = () => makeImmunize(
    (freeze) => makeHarden([], freeze),
    (obj, index, value) => { obj[index] = value; }
);

test('immunize(primitives)', () => {
    const immunize = defaultImmunize();
    expect(immunize('foo')).toBe('foo');
    expect(immunize(123)).toBe(123);
    expect(immunize(0.995)).toBe(0.995);
    expect(immunize(false)).toBe(false);
    expect(immunize(undefined)).toBe(undefined);
    expect(immunize(null)).toBe(null);
    expect(immunize((arg: number) => arg)(123)).toBe(123);
});

test('immunize(cache)', () => {
    const immunize = defaultImmunize();
    const f = (a: number, b: string) => b + a;
    expect(immunize(f)).not.toBe(f);
    expect(immunize(f)).toBe(immunize(f));
    expect(immunize(f)(123, 'str')).toBe(f(123, 'str'));
    const obj2 = {num: 123};
    const obj = {
        f() { return obj2; },
    };
    const io = immunize(obj);
    expect(io).not.toBe(obj);
    expect(io.f).not.toBe(obj.f);
    expect(io.f()).not.toBe(obj2);
    expect(io.f().num).toBe(obj2.num);
});
