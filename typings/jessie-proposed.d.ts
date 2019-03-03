// jessie-proposed.d.ts - Jessie proposed whitelist
// These are not part of the official Jessie whitelist, but are proposed
// to provide a smoother programming experience.
//
// When they have become a part of:
// https://github.com/Agoric/Jessie/blob/master/src/bundle/whitelist.js
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
}

interface StringConstructor {
    fromCharCode(...codes: number[]): string;
}
