interface SourceLocation {
    readonly uri: string;
    readonly byte: number;
    readonly line: number;
    readonly column: number;
}
interface TemplateStringsArray extends ReadonlyArray<string> {
    readonly sources?: ReadonlyArray<SourceLocation>;
}

// Note that InsulatedFunctions should not be mutable.
interface InsulatedArray<T> extends HardenedArray<Insulated<T>> {}
type InsulatedObject<T> = {
  readonly [K in keyof T]: Insulated<T[K]>
};
type InsulatedFunction<T> = T; // FIXME: Escape hatch.

type Insulated<T> =
  T extends Function ? InsulatedFunction<T> :
  T extends Primitive ? Readonly<T> :
  T extends Array<infer U> ? InsulatedArray<U> :
  // The following are just hardened, as described in lib.jessie.d.ts
  T extends Map<infer K, infer V> ? Map<K, V> :
  T extends WeakMap<infer WK, infer WV> ? WeakMap<WK, WV> :
  T extends Set<infer M> ? Set<M> :
  T extends WeakSet<infer WM> ? WeakSet<WM> :
  T extends Promise<infer R> ? Promise<R> :
  // All others are manually insulated.
    InsulatedObject<T>;

declare function insulate<T>(arg: T): Insulated<T>;

interface SlogTag<T> {
    (template: TemplateStringsArray, ...args: any[]): T;
    (context: {}): (template: TemplateStringsArray, ...args: any[]) => T;
    (contextOrTemplate: {} | TemplateStringsArray, ...args: any[]): ((template: TemplateStringsArray, ...args: any[]) => T) | T;
}

type SlogName = 'panic' | 'alert' | 'crit' | 'error' | 'warn' | 'notice' |
    'info' | 'debug' | 'trace' | 'stringify' | 'reject';


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
  
