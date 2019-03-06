// jessie-proposed.d.ts - Jessie proposed whitelist
// These are not part of the official Jessie whitelist, but are proposed
// to provide a smoother programming experience.
//
// When they have become a part of:
// https://github.com/Agoric/Jessie/blob/master/src/bundle/whitelist.js
// then they will be moved to lib.jessie.d.ts.
//
// Michael FIG <michael+jessica@fig.org>, 2019-02-23

interface IMainDependencies {
    loadAsset: (asset: string) => Promise<string>;
    writeOutput: (asset: string, data: string) => Promise<void>;
}

interface ObjectConstructor {
    readonly entries: ObjectEntries;
}

interface ObjectEntries {
    /**
     * Returns an array of key/values of the enumerable properties of an object
     * @param o Object that contains the properties and methods. This can be an object that you created or an existing Document Object Model (DOM) object.
     */
    <T>(o: { [s: string]: T } | ArrayLike<T>): [string, T][];

    /**
     * Returns an array of key/values of the enumerable properties of an object
     * @param o Object that contains the properties and methods. This can be an object that you created or an existing Document Object Model (DOM) object.
     */
    (o: {}): [string, any][];
}