function makeLoadAsset(CAN_LOAD_ASSETS, loadAsset) {
    const loader = (file) => {
        slog.error(`loading ${file}`);
        if (!CAN_LOAD_ASSETS.has(file)) {
            return Promise.reject(`${JSON.stringify(file)} not in INFILE whitelist`);
        }
        return loadAsset(file);
    };
    return harden(loader);
}
export default harden(makeLoadAsset);
