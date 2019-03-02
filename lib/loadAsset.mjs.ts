function makeLoadAsset(CAN_LOAD_ASSETS: Set<string>, loadAsset: (file: string) => Promise<string>) {
    const loader = (file: string) => {
        slog.error(`loading ${file}`);
        if (!CAN_LOAD_ASSETS.has(file)) {
            return Promise.reject(`${JSON.stringify(file)} not in INFILE whitelist`);
        }
        return loadAsset(file);
    };
    return harden(loader);
}

export default harden(makeLoadAsset);
