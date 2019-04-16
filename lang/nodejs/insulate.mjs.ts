// Prevent write access, and ensure objects don't pass the barrier
// between warm (inside warmTarget or the return values of its descendants)
// and cold (outside warmTarget), unless they are also insulated.
//
// The cold/warm identity maps are created fresh for each actual insulate()
// call, but not for the silent wrapping of returns, throws, this, and
// arguments.  This allows wrapping/unwrapping of values that transition
// the delineated insulation boundary with read-only Proxies rather
// having to harden them on every transition and losing useful but
// harmless mutability.
//
// The proxying provided by insulate() is orthogonal to harden() and
// Object.freeze.  You can still call harden() on your own data and
// pass it into insulated() functions, but not on proxies that have
// originated in an insulated() function, as that data belongs to
// somebody else).
//
// The nonMapped set is a list of global identities that should never
// be wrapped.  It is included for bootstrap purposes.
const makeInsulate = (nonMapped = new WeakSet<any>()): typeof insulate => {
    const insulate = (warmTarget: any) => {
        const warmToColdMap = new WeakMap<any, any>(), coldToWarmMap = new WeakMap<any, any>();
        const wrapWithMaps = (obj: any, inMap: WeakMap<any, any>, outMap: WeakMap<any, any>) => {
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
            const enter = (inbound: any) => wrapWithMaps(inbound, outMap, inMap);
            // If we want send an object out, we keep the order (our inside
            // is the object's inside).
            const leave = (outThunk: () => any) => {
                try {
                    return wrapWithMaps(outThunk(), inMap, outMap);
                } catch (e) {
                    throw wrapWithMaps(e, inMap, outMap);
                }
            };

            const err = (msg: string) => leave(() => {
                throw TypeError(msg);
            });
            const handler: ProxyHandler<any> = {
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

                // We maintain our extensible state, both for the
                // Proxy invariants and because we don't want to modify
                // the target AT ALL!
                isExtensible(target) {
                    return Reflect.isExtensible(target);
                },
                preventExtensions(target) {
                    if (!Reflect.isExtensible(target)) {
                        // Already prevented extensions, so succeed.
                        return true;
                    }
                    // This is a mutation.  Not allowed.
                    throw err(`Cannot prevent extensions of insulated object`);
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
