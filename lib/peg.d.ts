type PegPredicate = (self: any, pos: number) => [number, any];
interface IStringable {
    toString(): string;
}
type PegConstant = Readonly<IStringable>;

type PegRun = (self: any, ruleOrPatt: PegRuleOrPatt, pos: number, name: string) => [number, string[]];

type PegEat = (self: any, pos: number, str: PegExpr) => [number, string | PegConstant];
type PegAction = (...terms: any[]) => any;
type PegHole = PegConstant | PegAction;

interface IFlaggedTag<Base extends IFlaggedTag<Base, T>, T = any> {
    (template: TemplateStringsArray, ...args: any[]): T;
    (flag: string): Base;
}

interface IBootPegTag<T = any> {
    (template: TemplateStringsArray, ...args: PegHole[]): T;
    ACCEPT: PegPredicate;
    HOLE: PegPredicate;
    SKIP: PegConstant;
}

interface IPegParserTag<T = any> extends IFlaggedTag<IPegParserTag, T> {
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

interface IPegTag<T = any> extends IFlaggedTag<IPegTag, T> {
    ACCEPT: PegPredicate;
    FAIL: PegConstant;
    HOLE: PegPredicate;
    SKIP: PegConstant;
    EAT: PegEat;
    extends: <V, W = any>(peg: IPegParserTag<W>) => IPegTag<V>;
    _asExtending: <V, W = any>(baseQuasiParser: IPegParserTag<W>) => IPegTag<V>;
    parserCreator: PegParserCreator;
}

// TODO: Fill out all the tree from PegDef.
type PegExpr = string | any[];
type PegRuleOrPatt = (((..._args: any[]) => any) & {name: string}) | PegExpr;
type PegDef = any[];

type MakePeg = <T = IPegTag<any>, U = IPegTag<IPegParserTag<any>>>(
    pegTag: IBootPegTag<T>,
    metaCompile: (defs: PegDef[]) => (..._: any[]) => U) => T;
