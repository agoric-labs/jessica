const repl = (asset, readAsset, doEval, writeOutput, argv) => 
// Read...
harden(readAsset(asset)
    // Eval ...
    .then(data => { slog.error('got data ${data}'); return doEval(data, asset); })
    // Execute as main, if a function.
    .then(main => (typeof main === 'function') ? main({ readAsset, writeOutput }, argv) : main)
    // ... maybe Print.
    .then(val => {
    if (val !== undefined) {
        writeOutput('-', JSON.stringify(val, undefined, '  ') + '\n');
    }
}));
export default harden(repl);
//# sourceMappingURL=repl.mjs.js.map