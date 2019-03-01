// Create a `bond` function for use in Jessie endowments.
// https://github.com/Agoric/Jessie/issues/19
//
// TODO: This function desperately needs a test suite!

type ComputedGet = <T, K extends keyof T>(that: T, index: K) => T[K];
type ApplyMethod = <T, U>(that: any, method: (...args: T[]) => U, args: T[]) => U;

function makeBond(computedGet: ComputedGet, applyMethod: ApplyMethod) {
    const _bonded = makeWeakMap<Object, WeakMap<Function, Function>>(),
        _bondedUndefinedThis = makeWeakMap<Function, Function>();

    /**
     *  Given an object and an index, either
     * return a fresh method bound to the object,
     * a (cached) method we already bound,
     * or a plain value.
     *
     * Given an undefined index,
     * return a fresh arrow function bound to undefined,
     * a (cached) arrow we already bound,
     * or a plain value.
     */
    function bond<T, K extends keyof T>(maybeThis: T, index: K): T[K];
    function bond<T>(maybeThis: T): T;
    function bond(maybeThis: any, index?: number | string) {
        let maybeMethod: any;
        if (index === undefined) {
            maybeMethod = maybeThis;
        }
        else {
            if (typeof maybeThis !== 'object' || maybeThis === null) {
                throw makeError(`Can only call bond(obj, index) on an object, not ${JSON.stringify(maybeThis)}`);
            }
            maybeMethod = computedGet(maybeThis, index);
        }
        
        if (typeof maybeMethod !== 'function') {
            // Plain value.
            return maybeMethod;
        }
        const actualMethod: Function = maybeMethod;

        let actualThis: object, bondedForThis;
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
        const bondedMethod = harden((...args: any[]) =>
            applyMethod(actualThis, maybeMethod, args));
        
        // Cache the hardened, bound method.
        bondedForThis.set(actualMethod, bondedMethod);
        return bondedMethod;
    }
    
    return bond<Bond>(bond);
}

export default harden(makeBond);
