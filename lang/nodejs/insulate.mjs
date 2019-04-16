// Prevent write access, and ensure objects don't pass the barrier
// between warm (inside warmTarget) and cold (outside warmTarget), unless
// they are also insulated.
//
// All the cold objects share a map to warm objects in order to
// preserve global identities.  This is needed because some global
// identities must never be insulated.
//
// Warm objects, on the other hand, only keep their identity within
// a given insulated chain of functions.  Once they escape the function
// chain they are always insulated, and cannot be unwrapped.
const makeInsulate = (nonMapped = new WeakSet()) => {
    const insulate = (warmTarget) => {
        const warmToColdMap = new WeakMap(), coldToWarmMap = new WeakMap();
        const wrapWithMaps = (obj, inMap, outMap) => {
            if (Object(obj) !== obj || nonMapped.has(obj)) {
                // It's a neutral (primitive) type.
                return obj;
            }
            // We are sending out the object, so find it in the cache.
            const wrapped = outMap.get(obj);
            if (wrapped) {
                return wrapped;
            }
            // If we want an object to come in, we reverse the map (our
            // inside is the object's outside).
            const enter = (inbound) => wrapWithMaps(inbound, outMap, inMap);
            // If we want send an object out, we keep the order (our inside
            // is the object's inside).
            const leave = (outThunk) => {
                try {
                    return wrapWithMaps(outThunk(), inMap, outMap);
                }
                catch (e) {
                    throw wrapWithMaps(e, inMap, outMap);
                }
            };
            const err = (msg) => leave(() => {
                throw TypeError(msg);
            });
            const handler = {
                // Traps that make sure our object is read-only.
                defineProperty(_target, prop, _attributes) {
                    throw err(`Cannot define property ${JSON.stringify(String(prop))} on insulated object`);
                },
                setPrototypeOf(_target, _v) {
                    throw err(`Cannot set prototype of insulated object`);
                },
                set(_target, prop, _value) {
                    throw err(`Cannot set property ${JSON.stringify(String(prop))} on insulated object`);
                },
                // We maintain our extensible state, only for the
                // Proxy invariants and because we don't want to modify
                // the target AT ALL!
                isExtensible(target) {
                    return Reflect.isExtensible(target);
                },
                preventExtensions(target) {
                    // This is a mutation.  Not allowed.
                    if (!Reflect.isExtensible(target)) {
                        return true;
                    }
                    throw err(`Cannot prevent extensions on insulated object`);
                },
                // The traps that have a reasonably simple implementation:
                get(target, prop, receiver) {
                    return leave(() => Reflect.get(target, prop, receiver));
                },
                getPrototypeOf(target) {
                    return leave(() => Reflect.getPrototypeOf(target));
                },
                ownKeys(target) {
                    return leave(() => Reflect.ownKeys(target));
                },
                has(target, key) {
                    return leave(() => key in target);
                },
                getOwnPropertyDescriptor(target, prop) {
                    return leave(() => Reflect.getOwnPropertyDescriptor(target, prop));
                },
                // The recursively-wrapping traps.
                apply(target, thisArg, argumentsList) {
                    const wrappedThis = enter(thisArg);
                    const wrappedArguments = argumentsList.map(enter);
                    return leave(() => Reflect.apply(target, wrappedThis, wrappedArguments));
                },
                construct(target, args) {
                    const wrappedArguments = args.map(enter);
                    return leave(() => Reflect.construct(target, wrappedArguments));
                },
            };
            // Now we can construct an insulated object, which
            // makes it effectively read-only and transitively
            // maintains the temperatures of the inside and outside.
            const insulated = new Proxy(obj, handler);
            // We're putting the insulated object outside, so mark it
            // for our future inputs/outputs.
            outMap.set(obj, insulated);
            inMap.set(insulated, obj);
            return insulated;
        };
        return wrapWithMaps(warmTarget, coldToWarmMap, warmToColdMap);
    };
    // Prevent infinite regress.
    nonMapped.add(insulate);
    return insulate;
};
export default makeInsulate;
