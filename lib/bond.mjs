// Create a `bond` function for use in Jessie endowments.
// https://github.com/Agoric/Jessie/issues/19
function makeBond(computedGet, callMethod) {
    const _bonded = makeWeakSet([bond]);

    // Given an object and an index,
    // either return a fresh method bound to the object,
    // a (cached) method we already bound,
    // or a plain value.
    function bond(maybeThis, index) {
        const maybeMethod = computedGet(maybeThis, index);
        if (typeof maybeMethod !== 'function' || _bonded.has(maybeMethod)) {
            // The potential method is already wrapped, or is not a function.
            return maybeMethod;
        }

        // Wrap the method similar to `bind`.
        const bondedMethod = harden((...args) =>
            callMethod(maybeThis, maybeMethod, ...args));
        
        // Cache the hardened, bound method.
        _bonded.add(bondedMethod);
        return bondedMethod;
    };
    return harden(bond);
}

export default harden(makeBond);
