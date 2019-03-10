interface SourceLocation {
    readonly uri: string;
    readonly byte: number;
    readonly line: number;
    readonly column: number;
}
interface TemplateStringsArray extends ReadonlyArray<string> {
    readonly sources?: ReadonlyArray<SourceLocation>;
}

interface Bond {
    <T>(arg: T): T;
    <T, K extends keyof T>(arg: T, index: K): T[K];
  }
declare const bond: Hardened<Bond>;

interface SlogTag<T> {
    (template: TemplateStringsArray, ...args: any[]): T;
    (context: {}): (template: TemplateStringsArray, ...args: any[]) => T;
}

type SlogName = 'panic' | 'alert' | 'crit' | 'error' | 'warn' | 'notice' |
    'info' | 'debug' | 'trace' | 'DEFAULT' | 'reject';


interface Slog extends SlogTag<string> {
    LEVELS: Map<SlogName, number>;
    NAMES: SlogName[];
    panic: SlogTag<never>; // Displays to user, then exits the process.
    alert: SlogTag<never>; // Displays to user, then throws error.
    crit: SlogTag<never>; // Throws an error.
    error: SlogTag<never>; // Throws an error.
    warn: SlogTag<string>;
    notice: SlogTag<string>;
    info: SlogTag<string>;
    debug: SlogTag<string>;
    trace: SlogTag<string>;

    reject: SlogTag<Promise<any>>; // Returns a rejected Promise.
}

declare const slog: Hardened<Slog>;
  
