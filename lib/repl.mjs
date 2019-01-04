const repl = (doEval, asset, argv) =>
    // Read...
    harden(asset
    // Eval ...
    .then(data => doEval(data))
    // Execute as main, if a function.
    .then(main => (main instanceof Function) ? main(argv) : main)
    // ... maybe Print.
    .then(val => {
        if (val !== undefined) {
            console.log(JSON.stringify(val, undefined, '  '));
        }
    }));

export default harden(repl);
