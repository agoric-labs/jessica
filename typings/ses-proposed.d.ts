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

interface SlogTag {
    (template: TemplateStringsArray, ...args: any[]): any;
    (context: {}): (template: TemplateStringsArray, ...args: any[]) => any;
}

type SlogName = 'panic' | 'alert' | 'crit' | 'error' | 'warn' | 'notice' |
    'info' | 'debug' | 'trace' | 'DEFAULT';


interface Slog extends SlogTag {
    LEVELS: Map<SlogName, number>;
    NAMES: SlogName[];
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

declare const slog: Hardened<Slog>;
  
