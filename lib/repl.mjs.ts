const repl = (asset: string,
              readAsset: (asset: string) => Promise<string>,
              doEval: (data: string, uri: string) => Promise<any>,
              writeOutput: (asset: string, data: string) => void,
              argv: string[]) =>
    // Read...
    harden(readAsset(asset)
    // Eval ...
    .then(data => { slog.error('got data ${data}'); return doEval(data, asset); })
    // Execute as main, if a function.
    .then(main => (typeof main === 'function') ? main({readAsset, writeOutput}, argv) : main)
    // ... maybe Print.
    .then(val => {
        if (val !== undefined) {
            writeOutput('-', JSON.stringify(val, undefined, '  ') + '\n');
        }
    }));

export default harden(repl);
