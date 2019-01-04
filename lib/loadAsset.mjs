function makeLoadAsset(CAN_LOAD_ASSETS, fs) {
    const loader = (file) => {
        if (!CAN_LOAD_ASSETS.has(file)) {
            return Promise.reject(`${JSON.stringify(file)} not in INFILE whitelist`);
        }
        return new Promise((resolve, reject) => {
            fs.readFile(file, {encoding: 'utf-8'}, function(err, data) {
                if (err) {
                    return reject(err);
                }
                return resolve(data);
            });
        });
    };
    return def(loader);
}

export default def(makeLoadAsset);
