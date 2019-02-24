type PegPredicate = (self: any, pos: number) => [number, any];
interface Stringable {
    toString(): string;
}
type PegConstant = Readonly<Stringable>;

type PegRun = (self: any, ruleOrPatt: PegRuleOrPatt, pos: number, name: string) => [number, string[]];

type PegEat = (self: any, pos: number, str: PegExpr) => [number, string | PegConstant];

interface BootPegTag<T> {
    (template: TemplateStringsArray, ...args: any[]): T;
    ACCEPT: PegPredicate,
    HOLE: PegPredicate,
}

interface PegParser {
    _memo: Map<number, Map<PegRuleOrPatt, any>>;
    _debug: boolean;
    _hits: (n?: number) => number;
    _misses: (n?: number) => number;
    template: TemplateStringsArray['raw'];
}

interface PegTag {
    (template: TemplateStringsArray, ...args: any[]): PegTag;
    (debug: 'DEBUG'): (template: TemplateStringsArray, ...args: any[]) => PegTag;
    Parser: PegParser,
    extends(peg: PegTag): PegTag,
    ACCEPT: PegPredicate,
    FAIL: PegConstant,
    HOLE: PegPredicate,
    SKIP: PegConstant,
    ERROR: PegPredicate,
    RUN: PegRun,
    EAT: PegEat,
}

// TODO: Fill out all the tree from PegDef.
type PegExpr = string | any[];
type PegRuleOrPatt = (Function & {name: string}) | PegExpr;
type PegDef = any[];

type MakePeg = <T, U = any>(pegTag: BootPegTag<T>, metaCompile: (defs: PegDef[]) => U) => T;
