// Jessie endowments/SES.
declare function harden<T>(arg: T): Readonly<T>;

interface Bond {
  <T>(arg: T): T;
  <T, K extends keyof T>(arg: T, index: K): T[K];
}
declare const bond: Bond;

declare function makeError(reason: string): any;
declare function makeMap(): Map<any, any>;
declare function makeMap<K, V>(entries?: ReadonlyArray<[K, V]> | null): Map<K, V>;
declare function makeMap<K, V>(iterable: Iterable<[K, V]>): Map<K, V>;
declare function makeSet<T = any>(values?: ReadonlyArray<T> | null): Set<T>;
declare function makeWeakMap<K extends object = object, V = any>(entries?: ReadonlyArray<[K, V]> | null): WeakMap<K, V>;
declare function makeWeakSet<T extends object = object>(values?: ReadonlyArray<T> | null): WeakSet<T>;

interface ConfineOptions {
  // TODO fill out
}
declare function confine(src: string, evalenv: {}, options?: ConfineOptions): Readonly<any>;
declare function confineExpr(src: string, evalenv: {}, options?: ConfineOptions): Readonly<any>;
declare function eval(src: string): Readonly<any>;

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
