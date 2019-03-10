// Create a `bond` function for use in Jessie endowments.
// https://github.com/Agoric/Jessie/issues/19
//
// TODO: This function desperately needs a test suite!
function makeBond(applyMethod) {
    const _bonded = makeWeakMap(), _bondedUndefinedThis = makeWeakMap();
    function bond(maybeThis, index) {
        let maybeMethod;
        if (index === undefined) {
            maybeMethod = maybeThis;
        }
        else {
            if (typeof maybeThis !== 'object' || maybeThis === null) {
                slog.error `Can only call bond(obj, index) on an object, not ${{ maybeThis }}`;
            }
            maybeMethod = maybeThis[index];
        }
        if (typeof maybeMethod !== 'function') {
            // Plain value.
            return maybeMethod;
        }
        const actualMethod = maybeMethod;
        let actualThis, bondedForThis;
        if (index === undefined) {
            // Cache for undefined `this` value.
            bondedForThis = _bondedUndefinedThis;
        }
        else {
            actualThis = maybeThis;
            bondedForThis = _bonded.get(actualThis);
            if (!bondedForThis) {
                // Cache for `this` value.
                bondedForThis = makeWeakMap();
                _bonded.set(actualThis, bondedForThis);
            }
        }
        const bonded = bondedForThis.get(actualMethod);
        if (bonded) {
            // Already wrapped for `this` and the method.
            return bonded;
        }
        // Wrap the method similar to `bind`.
        const bondedMethod = harden((...args) => applyMethod(actualThis, maybeMethod, args));
        // Cache the hardened, bound method.
        bondedForThis.set(actualMethod, bondedMethod);
        return bondedMethod;
    }
    return bond(bond);
}
export default harden(makeBond);
