// Create an `immunize` function for use in Jessie endowments.
//
// Note that all the root's return values (from functions, and/or
// all the transitive function properties) are also immunized.
function makeImmunize(makeHarden, setComputedIndex) {
    // Create a hardener that attempts to immunize on the way.
    const immunizeHardener = makeHarden(tryWrapMethods);
    function tryWrapMethods(obj) {
        // Just do a best-effort immunizing the object's methods.
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value !== 'function') {
                continue;
            }
            const wrapped = wrap(value);
            try {
                // This means: arg[key] = wrapper;
                setComputedIndex(obj, key, wrapped);
            }
            catch (e) {
                break;
                // Keep going, obj is a Proxy or a frozen object that blocked
                // our attempt to set its property.
                // It can't have originated from Jessie, so this is an
                // endowment or primitive from the parent: arg[key] = wrapper.
            }
        }
    }
    const _wrapperMap = makeWeakMap();
    function wrap(arg) {
        let wrapper = _wrapperMap.get(arg);
        if (!wrapper) {
            // Make sure the function's return value is also immunized.
            wrapper = (...args) => newImmunize(arg(...args));
            _wrapperMap.set(arg, wrapper);
            // Copy over the wrapped function's properties.
            for (const [key, value] of Object.entries(arg)) {
                setComputedIndex(wrapper, key, value);
            }
        }
        return wrapper;
    }
    // Hardening that carries over into all the values that could
    // possibly be returned by members.
    function newImmunize(root) {
        // We may need to wrap the root before immunizing its children.
        const wrapper = (typeof root === 'function') ? wrap(root) : root;
        return immunizeHardener(wrapper);
    }
    // Since we already immunize our return values, we can use
    // the original harden.
    return immunizeHardener(newImmunize);
}
export default makeImmunize;
