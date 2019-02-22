type PegPredicate = (self: any, pos: number) => [number, any];
interface Stringable {
    toString(): string;
}
type PegConstant = Readonly<Stringable>;

type PegRun = (self: any, ruleOrPatt: any, pos: number, name: string) => [number, string[]];

type PegEat = (self: any, pos: number, str: string) => [number, string | PegConstant];

interface BootPegTag<T> {
    (template: TemplateStringsArray, ...args: any[]): T;
    (debug: 'DEBUG'): (template: TemplateStringsArray, ...args: any[]) => T;
    ACCEPT: PegPredicate,
    HOLE: PegPredicate,
}

interface PegTag {
    (template: TemplateStringsArray, ...args: any[]): PegTag;
    (debug: 'DEBUG'): (template: TemplateStringsArray, ...args: any[]) => PegTag;
    ACCEPT: PegPredicate,
    FAIL: PegConstant,
    HOLE: PegPredicate,
    SKIP: PegConstant,
    ERROR: PegPredicate,
    RUN: PegRun,
    EAT: PegEat,
}

// TODO: Fill out all the tree from PegDef.
type PegDef = ['def', any, any];
