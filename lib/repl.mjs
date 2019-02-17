const repl = (asset, doEval, printer, argv) =>
    // Read...
    harden(asset
    // Eval ...
    .then(data => doEval(data))
    // Execute as main, if a function.
    .then(main => (typeof main === 'function') ? main(argv) : main)
    // ... maybe Print.
    .then(val => {
        if (val !== undefined) {
            printer(JSON.stringify(val, undefined, '  '));
        }
    }));

export default harden(repl);
