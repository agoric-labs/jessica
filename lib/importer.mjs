import tagString from './tag-string.mjs';
function makeImporter(readInput, languageTag) {
    const importCache = makeMap();
    function importer(file, evaluator) {
        let val;
        if (!importCache.has(file)) {
            const src = readInput(file);
            const strParser = tagString(languageTag, file);
            const ast = strParser `${src}`;
            val = evaluator(ast);
            importCache.set(file, val);
        }
        else {
            val = importCache.get(file);
        }
        return val;
    }
    return harden(importer);
}
export default harden(makeImporter);
