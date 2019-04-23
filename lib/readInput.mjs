import { insulate } from '@agoric/jessie'; const makeReadInput = insulate((CAN_LOAD_FILES, readInput) => {
  const loader = file => {
    if (!CAN_LOAD_FILES.has(file)) {
      slog.error`${{ file }} not in INFILE whitelist`;
    }
    return readInput(file);
  };
  return loader;
});

export default makeReadInput;