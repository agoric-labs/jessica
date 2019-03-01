/// <reference types="jest"/>
import './globalEnv0';

import './globalEnv.mjs';

import makeBond from '../../lib/bond.mjs';

test('bond() primitives', () => {
    const bond = makeBond((that, index) => that[index], (that, method, args) => method.apply(that, args));
    expect(bond('foo')).toBe('foo');
    expect(bond(123)).toBe(123);
    expect(bond(0.995)).toBe(0.995);
    expect(bond((arg) => arg)(123)).toBe(123);
});
