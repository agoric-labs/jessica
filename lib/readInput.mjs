function makeReadInput(CAN_LOAD_ASSETS, readInput) {
    const loader = (file) => {
        slog.error(`loading ${file}`);
        if (!CAN_LOAD_ASSETS.has(file)) {
            return Promise.reject(`${JSON.stringify(file)} not in INFILE whitelist`);
        }
        return readInput(file);
    };
    return harden(loader);
}
export default harden(makeReadInput);
