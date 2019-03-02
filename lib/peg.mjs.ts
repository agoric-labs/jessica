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

type DebugTemplate = TemplateStringsArray | 'DEBUG';
interface IDebugTemplateTag<T> {
    (template: TemplateStringsArray, ...args: PegHole[]): IDebugTemplateTag<T> | T;
    (debug: 'DEBUG'): (template: TemplateStringsArray, ...args: PegHole[]) => IDebugTemplateTag<T>;
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

type ExtendedPegTag = (template: TemplateStringsArray, ...args: PegHole[]) => IPegTag;

interface IPegTag {
    (template: TemplateStringsArray, ...args: PegHole[]): IPegTag;
    (debug: 'DEBUG'): (template: TemplateStringsArray, ...args: PegHole[]) => IPegTag;
    parserCreator: PegParserCreator;
    ACCEPT: PegPredicate;
    FAIL: PegConstant;
    HOLE: PegPredicate;
    SKIP: PegConstant;
    EAT: PegEat;
    // TODO: Have ExtendedPegTag be the same as IPegTag.
    extends: (peg: IPegParserTag) => ExtendedPegTag;
    _asExtending(baseQuasiParser: IPegParserTag): IPegTag;
}

// TODO: Fill out all the tree from PegDef.
type PegExpr = string | any[];
type PegRuleOrPatt = (((..._args: any[]) => any) & {name: string}) | PegExpr;
type PegDef = any[];

type MakePeg = <T, U = any>(pegTag: IBootPegTag<T>, metaCompile: (defs: PegDef[]) => U) => T;
