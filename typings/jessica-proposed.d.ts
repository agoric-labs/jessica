// jessica-proposed.d.ts - Jessie proposed whitelist
// These are not part of the Jessie whitelist, but are proposed
// to provide a smoother programming experience.
//
// When they have become a part of:
//
// then they will be moved to lib.jessie.d.ts.
//
// Michael FIG <michael+jessica@fig.org>, 2019-02-23

interface Promise<T> {
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    readonly catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null) => Promise<T | TResult>;
}

interface ArrayConstructor {
    readonly isArray: (arg: any) => arg is Array<any>;
}

interface Array<T> {
    /**
      * Adds all the elements of an array separated by the specified separator string.
      * @param separator A string used to separate one element of an array from the next in the resulti
ng String.
      */
     readonly join: (separator: string) => string;
}
interface String {
    /**
      * Split a string into substrings using the specified separator and return them as an array.
      * @param separator A string that identifies character or characters to use in separating the string. If omitted, a single-element array containing the entire string is returned.
      * @param limit A value used to limit the number of elements returned in the array.
      */
    readonly split: (separator: string, limit?: number) => string[];

    /**
     * Returns a nonnegative integer Number less than 1114112 (0x110000) that is the code point
     * value of the UTF-16 encoded code point starting at the string element at position pos in
     * the String resulting from converting this object to a String.
     * If there is no element at that position, the result is undefined.
     * If a valid UTF-16 surrogate pair does not begin at pos, the result is the code unit at pos.
     */
    codePointAt(pos: number): number | undefined;

    // PROPOSED: Remove charCodeAt.
}

interface StringConstructor {
    /**
     * Return the String value whose elements are, in order, the elements in the List elements.
     * If length is 0, the empty string is returned.
     */
    readonly fromCodePoint: (...codePoints: number[]) => string;
}
