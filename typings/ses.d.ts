// Jessie endowments/SES.
type Immutable<T> =
  T extends Primitive ? T :
    T extends Array<infer U> ? ReadonlyArray<U> :
      T extends Map<infer K, infer V> ? ReadonlyMap<K, V> : Readonly<T>

type DeepImmutable<T> =
  T extends Primitive ? T :
    T extends Array<infer U> ? DeepImmutableArray<U> :
      T extends Map<infer K, infer V> ? DeepImmutableMap<K, V> : DeepImmutableObject<T>

interface DeepImmutableArray<T> extends ReadonlyArray<DeepImmutable<T>> {}
interface DeepImmutableMap<K, V> extends ReadonlyMap<DeepImmutable<K>, DeepImmutable<V>> {}
type DeepImmutableObject<T> = {
  readonly [K in keyof T]: DeepImmutable<T[K]>
}

declare function harden<T>(arg: T): DeepImmutable<T>;

interface Bond {
  <T>(arg: T): T;
  <T, K extends keyof T>(arg: T, index: K): T[K];
}
declare const bond: Bond;

declare function makeError(reason: string): DeepImmutable<any>;
declare function makeMap(): DeepImmutable<Map<any, any>>;
declare function makeMap<K, V>(entries?: ReadonlyArray<[K, V]> | null): DeepImmutable<Map<K, V>>;
declare function makeMap<K, V>(iterable: Iterable<[K, V]>): DeepImmutable<Map<K, V>>;
declare function makeSet<T = any>(values?: ReadonlyArray<T> | null): DeepImmutable<Set<T>>;
declare function makeWeakMap<K extends object = object, V = any>(entries?: ReadonlyArray<[K, V]> | null): DeepImmutable<WeakMap<K, V>>;
declare function makeWeakSet<T extends object = object>(values?: ReadonlyArray<T> | null): DeepImmutable<WeakSet<T>>;

/**
 * Creates a new Promise.
 * @param executor A callback used to initialize the promise. This callback is passed two arguments:
 * a resolve callback used to resolve the promise with a value or the result of another promise,
 * and a reject callback used to reject the promise with a provided reason or error.
 */
declare function makePromise<T>(executor: (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void): Promise<T>;

interface ConfineOptions {
  // TODO fill out
}
declare function confine(src: string, evalenv: {}, options?: ConfineOptions): DeepImmutable<any>;
declare function confineExpr(src: string, evalenv: {}, options?: ConfineOptions): DeepImmutable<any>;
declare function eval(src: string): DeepImmutable<any>;

interface SlogTag {
  (template: TemplateStringsArray, ...args: any[]): any;
  (context: {}): (template: TemplateStringsArray, ...args: any[]) => any;
}

interface Slog extends SlogTag {
  panic: SlogTag;
  alert: SlogTag;
  crit: SlogTag;
  error: SlogTag;
  warn: SlogTag;
  notice: SlogTag;
  info: SlogTag;
  debug: SlogTag;
  trace: SlogTag;
}

declare const slog: Slog;
