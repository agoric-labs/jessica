import tagString from './tag-string.mjs';

function makeImporter(readInput: (file: string) => string, languageTag: IParserTag<any[]>) {
    const importCache = makeMap<string, any>();
    function importer(file: string, evaluator: (ast: any[]) => any) {
        let val: any;
        if (!importCache.has(file)) {
            const src = readInput(file);
            const strParser = tagString(languageTag, file);
            const ast = strParser`${src}`;
            val = evaluator(ast);
            importCache.set(file, val);
        } else {
            val = importCache.get(file);
        }
        return val;
    }
    return harden(importer);
}

export default harden(makeImporter);
