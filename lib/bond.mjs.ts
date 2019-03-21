// Create a `bond` function for use in Jessie endowments.
// https://github.com/Agoric/Jessie/issues/19

type ApplyMethod = <T, U>(that: any, method: (...args: T[]) => U, args: T[]) => U;
type AnyMethod = (this: any, ...args: any[]) => any;
type AnyArrow = (...args: any[]) => any;

const makeBond = immunize((applyMethod: ApplyMethod) => {
    const _bonded = makeWeakMap<object, WeakMap<AnyMethod, AnyArrow>>(),
        _bondedUndefinedThis = makeWeakMap<AnyMethod, AnyArrow>();

    /**
     * Given an object and an index, either
     * return a fresh method bound to the object that immunizes its args,
     * a (cached) method we already bound,
     * or a plain value.
     *
     * Given an undefined index,
     * return a fresh arrow function bound to undefined that immunizes its args,
     * a (cached) arrow we already bound,
     * or a plain value.
     */
    function bond<T, K extends keyof T>(maybeThis: T, index: K): T[K];
    function bond<T>(maybeThis: T): T;
    function bond(maybeThis: any, index?: number | string) {
        let maybeMethod: any;
        if (index === undefined) {
            maybeMethod = maybeThis;
        } else {
            if (typeof maybeThis !== 'object' || maybeThis === null) {
                slog.error`Can only call bond(obj, index) on an object, not ${{maybeThis}}`;
            }
            maybeMethod = maybeThis[index];
        }

        if (typeof maybeMethod !== 'function') {
            // Plain value.
            return maybeMethod;
        }
        const actualMethod: AnyMethod = maybeMethod;

        let actualThis: object, bondedForThis;
        if (index === undefined) {
            // Cache for undefined `this` value.
            bondedForThis = _bondedUndefinedThis;
        } else {
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
        const bondedMethod = (...args: any[]) =>
            applyMethod(actualThis, maybeMethod, args.map(immunize));

        // Cache the immunized, bound method.
        bondedForThis.set(actualMethod, bondedMethod);
        return bondedMethod;
    }

    return bond<Bond>(bond);
});

export default makeBond;
