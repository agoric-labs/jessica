// DO NOT EDIT - Generated automatically from bond.mjs.ts by tessc
// Create a `bond` function for use in Jessie endowments.
// https://github.com/Agoric/Jessie/issues/19
const makeBond = immunize((applyMethod) => {
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
        // Immunize the arguments, since they may come from an internal
        // object that has not been returned for the module-level
        // immunize to act on.
        const bondedMethod = (...args) => applyMethod(actualThis, maybeMethod, args.map(immunize));
        // Cache the immunized, bound method.
        bondedForThis.set(actualMethod, bondedMethod);
        return bondedMethod;
    }
    return bond(bond);
});
export default immunize(makeBond);
