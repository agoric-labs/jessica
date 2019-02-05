// Create a `bond` function for use in Jessie endowments.
// https://github.com/Agoric/Jessie/issues/19
//
// TODO: This function desperately needs a test suite!
function makeBond(computedGet, callMethod) {
    const _bonded = makeWeakMap(), _bondedUndefinedThis = makeWeakMap();

    // Given an object and an index,
    // either return a fresh method bound to the object,
    // a (cached) method we already bound,
    // or a plain value.
    //
    // Given an undefined index,
    // return a fresh arrow function bound to undefined,
    // a (cached) arrow we already bound,
    // or a plain value.
    const bond = (maybeThis, index) => {
        let maybeMethod;
        if (index === undefined) {
            maybeMethod = maybeThis;
        }
        else {
            if (typeof maybeThis !== 'object' || maybeThis === null) {
                throw `Can only call bond(obj, index) on an object, not ${JSON.stringify(maybeThis)}`;
            }
            maybeMethod = computedGet(maybeThis, index);
        }
        
        if (typeof maybeMethod !== 'function') {
            // Plain value.
            return maybeMethod;
        }

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

        const bonded = bondedForThis.get(maybeMethod);
        if (bonded) {
            // Already wrapped for `this` and the method.
            return bonded;
        }

        // Wrap the method similar to `bind`.
        const bondedMethod = harden((...args) =>
            applyMethod(actualThis, maybeMethod, args));
        
        // Cache the hardened, bound method.
        bondedForThis.set(maybeMethod, bondedMethod);
        return bondedMethod;
    };
    
    return bond(bond);
}

export default harden(makeBond);
