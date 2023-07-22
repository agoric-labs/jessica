// import { insulate } from '@agoric/jessie'; import { slog as $i_slog } from '@michaelfig/slog';const slog = insulate($i_slog);

const { freeze: insulate } = Object;

const makeReadInput = insulate((CAN_LOAD_FILES, readInput) => {
  const loader = file => {
    if (!CAN_LOAD_FILES.has(file)) {
      slog.error`${{ file }} not in INFILE whitelist`;
    }
    return readInput(file);
  };
  return loader;
});

export default makeReadInput;