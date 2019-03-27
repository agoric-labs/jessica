// DO NOT EDIT - Generated automatically from readInput.mjs.ts by tessc
const makeReadInput = immunize((CAN_LOAD_FILES, readInput) => {
  const loader = file => {
    if (!CAN_LOAD_FILES.has(file)) {
      slog.error`${{ file }} not in INFILE whitelist`;
    }
    return readInput(file);
  };
  return loader;
});

export default immunize(makeReadInput);