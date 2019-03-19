// Create a `purify` function for use in Jessie endowments.
function makePurify(makeHarden, computedSet, freeze) {
    // Create a hardener that attempts to purify on the way.
    const purifyingHardener = makeHarden(tryWrapThenFreeze);
    function tryWrapThenFreeze(arg) {
        // Just do a best-effort purifying of the object's properties.
        for (const key of Object.keys(arg)) {
            try {
                computedSet(arg, key, maybeWrap(arg[key]));
            }
            catch (e) {
                // Keep going.
            }
        }
        return freeze(arg);
    }
    const _wrappedFuncMap = makeWeakMap();
    function maybeWrap(arg) {
        if (typeof arg !== 'function') {
            // Don't wrap non-functions.
            return arg;
        }
        let wrapper = _wrappedFuncMap.get(arg);
        if (!wrapper) {
            // Make sure the function's return value is also purified.
            wrapper = (...args) => purify(arg(...args));
            _wrappedFuncMap.set(arg, wrapper);
            // Copy over the wrapped function's properties.
            for (const [key, value] of Object.entries(arg)) {
                computedSet(wrapper, key, value);
            }
        }
        return wrapper;
    }
    function purify(root) {
        // We may need to wrap the root before hardening.
        return purifyingHardener(maybeWrap(root));
    }
    // Since we already harden our return, we just use the original harden.
    return purifyingHardener(purify);
}
export default makePurify;
