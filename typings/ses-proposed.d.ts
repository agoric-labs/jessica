interface SourceLocation {
    readonly uri: string;
    readonly byte: number;
    readonly line: number;
    readonly column: number;
}
interface TemplateStringsArray extends ReadonlyArray<string> {
    readonly sources?: ReadonlyArray<SourceLocation>;
}

// Note that ImmuneFunctions should not be mutable.
type ImmuneFunction<T> = (...args: ArgsType<T>) => Immune<RetType<T>>;
interface ImmuneArray<T> extends HardenedArray<Immune<T>> {}
type ImmuneObject<T> = {
  readonly [K in keyof T]: Immune<T[K]>
};

type Immune<T> =
  T extends Function ? ImmuneObject<T> & ImmuneFunction<T> :
  T extends Primitive ? Readonly<T> :
  T extends Array<infer U> ? ImmuneArray<U> :
  // The following are just hardened, as described in lib.jessie.d.ts
  T extends Map<infer K, infer V> ? Map<K, V> :
  T extends WeakMap<infer WK, infer WV> ? WeakMap<WK, WV> :
  T extends Set<infer M> ? Set<M> :
  T extends WeakSet<infer WM> ? WeakSet<WM> :
  T extends Promise<infer R> ? Promise<R> :
  // All others are manually immunized.
    ImmuneObject<T>;

declare function immunize<T>(arg: T): Immune<T>;

interface Bond {
    <T>(arg: T): T;
    <T, K extends keyof T>(arg: T, index: K): T[K];
}
declare const bond: Hardened<Bond>;

interface SlogTag<T> {
    (template: TemplateStringsArray, ...args: any[]): T;
    (context: {}): (template: TemplateStringsArray, ...args: any[]) => T;
    (contextOrTemplate: {} | TemplateStringsArray, ...args: any[]): ((template: TemplateStringsArray, ...args: any[]) => T) | T;
}

type SlogName = 'panic' | 'alert' | 'crit' | 'error' | 'warn' | 'notice' |
    'info' | 'debug' | 'trace' | 'DEFAULT' | 'reject';


interface Slog extends SlogTag<string> {
    LEVELS: Map<SlogName, number>;
    NAMES: SlogName[];
    panic: SlogTag<never>; // Displays to user, waits for confirm, then exits.
    alert: SlogTag<never>; // Displays to user, waits for confirm, then throws error.
    crit: SlogTag<never>; // Displays to user, then throws error.
    error: SlogTag<never>; // Throws error.
    warn: SlogTag<string>; // Just logs.
    notice: SlogTag<string>;
    info: SlogTag<string>;
    debug: SlogTag<string>;
    trace: SlogTag<string>; // Normally invisible.

    reject: SlogTag<Promise<never>>; // Returns a rejected Promise.
}

declare const slog: Hardened<Slog>;
  
