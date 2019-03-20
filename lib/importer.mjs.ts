import tagString from './tag-string.mjs';

const makeImporter = immunize((readInput: (file: string) => string, languageTag: IParserTag<any[]>) => {
    const importCache = makeMap<string, any>();

    const IMPORT_RECURSION = {
        toString: () => 'IMPORT_RECURSION',
    };

    function importer(file: string, evaluator: (ast: any[]) => any) {
        let val: any;
        if (!importCache.has(file)) {
            try {
                importCache.set(file, IMPORT_RECURSION);
                const src = readInput(file);
                const strParser = tagString(languageTag, file);
                const ast = strParser`${src}`;
                val = evaluator(ast);
            } catch (e) {
                // Clean up our recursion tag on error.
                importCache.delete(file);
                throw e;
            }
            importCache.set(file, val);
        } else {
            val = importCache.get(file);
            if (val === IMPORT_RECURSION) {
                slog.error`Import recursion while resolving ${{file}}`;
            }
        }
        return val;
    }
    return importer;
});

export default makeImporter;
