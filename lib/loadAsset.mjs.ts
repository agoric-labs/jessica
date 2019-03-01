type Callback<T> = (err: any, data: T) => void;
type FileReader = (file: string, opts: {[key: string]: any}, cb: Callback<string>) => void;

function makeLoadAsset(CAN_LOAD_ASSETS: Set<string>, readFile: FileReader) {
    const loader = (file: string) => {
        if (!CAN_LOAD_ASSETS.has(file)) {
            return Promise.reject(`${JSON.stringify(file)} not in INFILE whitelist`);
        }
        return makePromise<string>((resolve, reject) => {
            readFile(file, {encoding: 'latin1'}, function readCb(err: any, data: string) {
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
