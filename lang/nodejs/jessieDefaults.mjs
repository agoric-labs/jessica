/// <reference path="../../typings/ses.d.ts"/>
/// <reference path="node_modules/@types/node/ts3.1/index.d.ts"/>
import * as jessie from '@agoric/jessie';
const globalEnv = Object.assign({}, jessie);
const harden = jessie.harden;
export const insulate = jessie.insulate;
export const applyMethod = harden((thisObj, method, args) => Reflect.apply(method, thisObj, args));
export const setComputedIndex = harden((obj, index, val) => {
    if (index === '__proto__') {
        slog.error `Cannot set ${{ index }} object member`;
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
