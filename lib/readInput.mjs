const makeReadInput = immunize((CAN_LOAD_FILES, readInput) => {
    readInput = bond(readInput);
    const loader = (file) => {
        if (!CAN_LOAD_FILES.has(file)) {
            slog.error `${{ file }} not in INFILE whitelist`;
        }
        return readInput(file);
    };
    return loader;
});
export default makeReadInput;
