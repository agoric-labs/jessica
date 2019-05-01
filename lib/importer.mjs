import { insulate } from '@agoric/jessie'; import { slog as $i_slog } from '@michaelfig/slog';const slog = insulate($i_slog);
import $i_tagString from './tag-string.mjs';const tagString = insulate($i_tagString);

const makeImporter = insulate((
importCache,
readInput,
languageTag) => {
  const IMPORT_RECURSION = {
    toString: () => 'IMPORT_RECURSION' };


  function importer(file, evaluator) {
    let val;
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
        slog.error`Import recursion while resolving ${{ file }}`;
      }
    }
    return val;
  }
  return importer;
});

export default makeImporter;