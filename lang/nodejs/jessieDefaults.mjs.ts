/// <reference path="../../typings/ses.d.ts"/>
/// <reference path="node_modules/@types/node/ts3.1/index.d.ts"/>

import * as jessie from '@agoric/jessie';
const {insulate: _, ...globalEnv} = {...jessie};
const harden = jessie.harden;

// Cannot be used for bootstrap.
export const insulate = jessie.insulate;

export const applyMethod = harden(<T>(thisObj: any, method: (...args: any) => T, args: any[]): T =>
    Reflect.apply(method, thisObj, args));

export const setComputedIndex = harden(<T>(obj: any, index: string | number, val: T) => {
    if (index === '__proto__') {
        jessie.slog.error`Cannot set ${{index}} object member`;
    }
    return obj[index] = val;
});

// Don't insulate the arguments to setComputedIndex.
import { $h_uninsulated } from '@agoric/jessie/lib/insulate.mjs';
$h_uninsulated.add(setComputedIndex);

// Truncate sourceURL.
import { $h_sourceURLLength } from '@agoric/jessie/lib/confine.mjs';
$h_sourceURLLength(40);

export default globalEnv;
