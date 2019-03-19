// Jessie endowments/SES.
/// <reference path="./ses-proposed.d.ts"/>

/* TODO: Add declarations for:
      cajaVM: {                        // Caja support
        Nat: j,
        def: j,
  
        confine: j,
      },
*/

type Primitive = undefined | null | boolean | string | number | Function;

type ArgsType<T> = T extends (...args: infer U) => any ? U : never;
type RetType<T> = T extends (...args: any[]) => infer U ? U : never;

// FIXME: Somehow specify that the resulting function is readonly.
type HardenedFunction<T> = (...args: ArgsType<T>) => RetType<T>;

type Hardened<T> =
  T extends Function ? T & HardenedFunction<T> :
  T extends Primitive ? Readonly<T> :
  T extends Array<infer U> ? HardenedArray<U> :
  // The following are always hardened, as described in lib.jessie.d.ts
  T extends Map<infer K, infer V> ? Map<K, V> :
  T extends WeakMap<infer WK, infer WV> ? WeakMap<WK, WV> :
  T extends Set<infer M> ? Set<M> :
  T extends WeakSet<infer WM> ? WeakSet<WM> :
  T extends Promise<infer R> ? Promise<R> :
  // All others are manually hardened.
    HardenedObject<T>;

interface HardenedArray<T> extends Readonly<Array<Hardened<T>>> {}
type HardenedObject<T> = {
  readonly [K in keyof T]: Hardened<T[K]>
};

declare function harden<T>(arg: T): Hardened<T>;

declare function makeMap(): Hardened<Map<any, any>>;
declare function makeMap<K, V>(entries?: ReadonlyArray<[K, V]> | null): Hardened<Map<K, V>>;
declare function makeMap<K, V>(iterable: Iterable<[K, V]>): Hardened<Map<K, V>>;
declare function makeSet<T = any>(values?: ReadonlyArray<T> | null): Hardened<Set<T>>;
declare function makeWeakMap<K extends object = object, V = any>(entries?: ReadonlyArray<[K, V]> | null): Hardened<WeakMap<K, V>>;
declare function makeWeakSet<T extends object = object>(values?: ReadonlyArray<T> | null): Hardened<WeakSet<T>>;

/**
 * Creates a new Promise.
 * @param executor A callback used to initialize the promise. This callback is passed two arguments:
 * a resolve callback used to resolve the promise with a value or the result of another promise,
 * and a reject callback used to reject the promise with a provided reason or error.
 */
declare function makePromise<T>(executor: (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void): Hardened<Promise<T>>

interface ConfineOptions {
  // TODO fill out
  scriptName?: string;
}
declare function confine<T>(src: string, evalenv: Record<string, any>, options?: ConfineOptions): T;
declare function confineExpr<T>(src: string, evalenv: Record<string, any>, options?: ConfineOptions): T;
