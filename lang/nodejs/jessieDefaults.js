/// <reference path="../../typings/ses.d.ts"/>
/// <reference path="node_modules/@types/node/ts3.1/index.d.ts"/>
import * as jessie from '@agoric/jessie';
import { slog } from '@michaelfig/slog';
const harden = jessie.harden;
export const applyMethod = harden((thisObj, method, args) => Reflect.apply(method, thisObj, args));
export const setComputedIndex = harden((obj, index, val) => {
    if (index === '__proto__') {
        slog.error `Cannot set ${{ index }} object member`;
    }
    return obj[index] = val;
});
// Don't insulate the arguments to setComputedIndex.
import insulate, { $h_already } from '@agoric/jessie/lib/insulate.js';
$h_already.add(setComputedIndex);
for (const j of Object.values(jessie)) {
    $h_already.add(j);
}
export { insulate };
// Truncate sourceURL.
import { $h_sourceURLLength } from '@agoric/jessie/lib/confine.js';
$h_sourceURLLength(40);
