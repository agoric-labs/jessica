/// <reference path="../node_modules/@types/jest/index.d.ts"/>
import {insulate} from '../globalEnv.mjs';

test('insulate(primitives)', () => {
    expect(insulate('foo')).toBe('foo');
    expect(insulate(123)).toBe(123);
    expect(insulate(0.995)).toBe(0.995);
    expect(insulate(false)).toBe(false);
    expect(insulate(undefined)).toBe(undefined);
    expect(insulate(null)).toBe(null);
    expect(insulate((arg: number) => arg)(123)).toBe(123);
});

test('insulate(identity)', () => {
    const f = (a: any) => a;
    const f2 = insulate(f);
    expect(f2).not.toBe(f);
    const obj = {num: 123};
    expect(f(obj)).toBe(obj);
    expect(f2(obj)).toBe(obj);

    // Running another insulate() will create new maps, but
    // they will unwrap properly on exit.
    const obj2: Record<string, any> = {num: 345};
    const f3 = insulate(f2);
    obj2.num = 456;
    expect(f3(obj2)).toBe(f3(obj2));
    obj2.num = 567;
    // Mutable, and extensible.
    expect(obj2.abc = 'aaa').toBe('aaa');
    expect(f3(obj2)).toBe(obj2);
    expect(f3(obj)).toBe(obj);
    expect(f2).not.toBe(f3);
});

test('insulate(protection)', () => {
    const mutate = insulate((a: any) => a.bar = 123);
    const obj: Record<string, any> = {bar: 123};
    expect(() => mutate(obj)).toThrow(TypeError);
    expect(obj.bar).toBe(123);
    obj.bar = 234;
    expect(obj.bar).toBe(234);
    obj.other = 'xyz';
    expect(obj.other).toBe('xyz');

    const create = insulate((): Record<string, any> => ({}));
    const obj2 = create();
    expect(() => obj2.abc = 'aaa').toThrow(/^Cannot set property "abc"/);
});
