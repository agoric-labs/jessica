/// <reference types="jest"/>
import '../globalEnv0';

import '../globalEnv.mjs';

import makeBond from '../../../lib/bond.mjs';
const defaultBond = () => makeBond(
    (that, index) => that[index],
    (that, method, args) => method.apply(that, args));

test('bond(primitives)', () => {
    const bond = defaultBond();
    expect(bond('foo')).toBe('foo');
    expect(bond(123)).toBe(123);
    expect(bond(0.995)).toBe(0.995);
    expect(bond(false)).toBe(false);
    expect(bond(undefined)).toBe(undefined);
    expect(bond(null)).toBe(null);
    expect(bond((arg: number) => arg)(123)).toBe(123);
});

test('bond(cache)', () => {
    const bond = defaultBond();
    const f = (a: number, b: string) => b + a;
    expect(bond(f)).not.toBe(f);
    expect(bond(f)).toBe(bond(f));
    expect(bond(f)(123, 'str')).toBe(f(123, 'str'));
    const obj = {
        f() { return 'hi'; },
    };
    const bf = bond(obj, 'f');
    expect(bf).not.toBe(obj.f);
    expect(bf).toBe(bond(obj, 'f'));
    const otherObj = {
        ...obj,
    };
    const bof = bond(otherObj, 'f');
    expect(bof).not.toBe(obj.f);
    expect(bof).not.toBe(otherObj.f);
    expect(bof).toBe(bond(otherObj, 'f'));

    const arr = [obj.f];
    const ba0 = bond(arr, 0);
    expect(ba0).not.toBe(obj.f);
    expect(ba0).toBe(bond(arr, 0));
});

test('bond(capture)', () => {
    const bond = defaultBond();
    function MyObj(val: number) {
        this.val = val;
    }
    MyObj.prototype.meth = function meth(a: number) {
        return this.val + a;
    };
    const obj = new MyObj(123);
    expect(obj.meth(456)).toBe(579);

    const captureThis = {
        meth: obj.meth,
        val: 1,
    };
    expect(captureThis.meth(2)).toBe(3);

    const noCaptureThis = {
        meth: bond(obj, 'meth'),
        val: 1,
    };
    expect(noCaptureThis.meth(2)).toBe(125);
});
