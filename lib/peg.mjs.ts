type PegPredicate = (self: any, pos: number) => [number, any];
interface IStringable {
    toString(): string;
}
type PegConstant = Readonly<IStringable>;

type PegRun = (self: any, ruleOrPatt: PegRuleOrPatt, pos: number, name: string) => [number, string[]];

type PegEat = (self: any, pos: number, str: PegExpr) => [number, string | PegConstant];
type PegAction = (...terms: any[]) => any;
type PegHole = PegConstant | PegAction;

interface IBootPegTag<T> {
    (template: TemplateStringsArray, ...args: PegHole[]): T;
    ACCEPT: PegPredicate;
    HOLE: PegPredicate;
}

interface IPegParserTag {
    (template: TemplateStringsArray, ...args: PegHole[]): any;
    parserCreator: PegParserCreator;
}

interface IPegParser {
    _memo: Map<number, Map<PegRuleOrPatt, any>>;
    _debug: boolean;
    _hits: (n?: number) => number;
    _misses: (n?: number) => number;
    template: TemplateStringsArray['raw'];
    start: (parser: IPegParser) => any;
    done: (parser: IPegParser) => void;
}

type PegParserCreator = (template: TemplateStringsArray, debug: boolean) => IPegParser | undefined;

interface IPegTag {
    (template: TemplateStringsArray, ...args: PegHole[]): IPegTag;
    (debug: 'DEBUG'): (template: TemplateStringsArray, ...args: PegHole[]) => IPegTag;
    ParserCreator: PegParserCreator;
    ACCEPT: PegPredicate;
    FAIL: PegConstant;
    HOLE: PegPredicate;
    SKIP: PegConstant;
    ERROR: PegPredicate;
    RUN: PegRun;
    EAT: PegEat;
    extends(peg: IPegTag): IPegTag;
}

// TODO: Fill out all the tree from PegDef.
type PegExpr = string | any[];
type PegRuleOrPatt = (((..._args: any[]) => any) & {name: string}) | PegExpr;
type PegDef = any[];

type MakePeg = <T, U = any>(pegTag: IBootPegTag<T>, metaCompile: (defs: PegDef[]) => U) => T;
