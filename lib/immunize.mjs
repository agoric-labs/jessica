// Create an `immunize` function for use in Jessie endowments.
//
// Recursively freeze the root, a la harden.  If it is a function
// or contains a reachable property that is an function, that
// function will be replaced by a memoized hardened wrapper that
// immunizes its return value.
//
// A baroque Proxy or frozen object cannot be immunized, but will still be
// hardened.  These are objects that cannot possibly contain mutable Jessie
// objects (since all Jessie objects have been immunized before export), so
// this incompleteness does not compromise Jessie.
const makeImmunize = immunize((makeHarden, setComputedIndex) => {
    // Create a hardener that attempts to immunize functions on the way.
    const immunizeHardener = makeHarden(tryWrapMethods);
    function tryWrapMethods(obj) {
        // Just do a best-effort immunizing the object's methods.
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value !== 'function') {
                continue;
            }
            const wrapped = wrap(value);
            try {
                // This means: obj[key] = wrapper;
                setComputedIndex(obj, key, wrapped);
            }
            catch (e) {
                // obj is a Proxy, or frozen object that blocked
                // our attempt to set its property.
                // It can't have originated from Jessie, so this is an
                // endowment or primitive from the parent environment
                // which wasn't added to harden's initialFringe.
                // Just abort wrapping this object's methods.
                // FIXME: Maybe do something more clever.
                break;
            }
        }
    }
    const _wrapperMap = makeWeakMap();
    function wrap(fn) {
        let wrapper = _wrapperMap.get(fn);
        if (!wrapper) {
            // Make sure the function's return/throw value is also immunized.
            wrapper = (...args) => {
                let ret;
                try {
                    ret = fn(...args);
                }
                catch (e) {
                    throw newImmunize(e);
                }
                return newImmunize(ret);
            };
            // Memoize our results.
            _wrapperMap.set(fn, wrapper);
            _wrapperMap.set(wrapper, wrapper);
            // Copy in the wrapped function's properties (if any).
            // These are immunized in the next traversal.
            for (const [key, value] of Object.entries(fn)) {
                setComputedIndex(wrapper, key, value);
            }
        }
        return wrapper;
    }
    function newImmunize(root) {
        // We may need to wrap the root before immunizing its children.
        if (typeof root === 'function') {
            const wrapRoot = wrap(root);
            return immunizeHardener(wrapRoot);
        }
        return immunizeHardener(root);
    }
    return newImmunize;
});
export default immunize(makeImmunize);
