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
    SKIP: PegConstant;
}

interface IPegParserTag<T = any, U extends string = string> {
    (template: TemplateStringsArray, ...args: PegHole[]): T;
    (config: U): IPegParserTag<T, U>;
    parserCreator: PegParserCreator;
}

interface IPegParser {
    _memo: Map<number, Map<PegRuleOrPatt, any>>;
    _debug: boolean;
    _hits: (n?: number) => number;
    _misses: (n?: number) => number;
    template: TemplateStringsArray;
    start: (parser: IPegParser) => any;
    done: (parser: IPegParser) => void;
}

type PegParserCreator = (template: TemplateStringsArray, debug: boolean) => IPegParser | undefined;

interface IPegTag<T = any, U extends string = string> {
    (template: TemplateStringsArray, ...args: PegHole[]): T;
    (config: U): IPegTag<T, U>;
    ACCEPT: PegPredicate;
    FAIL: PegConstant;
    HOLE: PegPredicate;
    SKIP: PegConstant;
    EAT: PegEat;
    extends: <V>(peg: IPegParserTag) => IPegTag<IPegParserTag<V>>;
    _asExtending: <V>(baseQuasiParser: IPegParserTag) => IPegTag<IPegParserTag<V>>;
    parserCreator: PegParserCreator;
}

// TODO: Fill out all the tree from PegDef.
type PegExpr = string | any[];
type PegRuleOrPatt = (((..._args: any[]) => any) & {name: string}) | PegExpr;
type PegDef = any[];

type MakePeg = <T = IPegTag<any>, U = IPegTag<IPegParserTag<any>>>(
    pegTag: IBootPegTag<T>,
    metaCompile: (defs: PegDef[]) => (..._: any[]) => U) => T;
