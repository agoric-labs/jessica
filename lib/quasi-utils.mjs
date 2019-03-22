// DO NOT EDIT - Generated automatically from quasi-utils.mjs.ts by tessc
/// <reference path="peg.d.ts"/>
const qunpack = immunize((h, ms, t) => {
    return [h, ...ms, t];
});
const qrepack = immunize((parts) => {
    // TODO bug: We only provide the raw form at this time. I
    // apologize once again for allowing a cooked form into the
    // standard.
    const raw = [parts[0]];
    const argExprs = [];
    const len = parts.length;
    for (let i = 1; i < len; i += 2) {
        argExprs.push(parts[i]);
        raw.push(parts[i + 1]);
    }
    const template = { raw };
    return [['data', template], ...argExprs];
});
export default immunize({ qunpack, qrepack });
