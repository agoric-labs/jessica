function makeLoadAsset(CAN_LOAD_ASSETS, readFile) {
    const loader = (file) => {
        if (!CAN_LOAD_ASSETS.has(file)) {
            return Promise.reject(`${JSON.stringify(file)} not in INFILE whitelist`);
        }
        return makePromise((resolve, reject) => {
            readFile(file, { encoding: 'latin1' }, function (err, data) {
                if (err) {
                    return reject(err);
                }
                return resolve(data);
            });
        });
    };
    return harden(loader);
}
export default harden(makeLoadAsset);
//# sourceMappingURL=loadAsset.mjs.js.map