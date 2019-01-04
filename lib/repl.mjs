const repl = (doEval, asset) =>
    // Read...
    harden(asset
    // Eval ...
    .then(data => doEval(data))
    // Execute as main, if a function.
    .then(main => (main instanceof Function) ? main(ARGV) : main)
    // ... maybe Print.
    .then(val => {
        if (val !== undefined) {
            console.log(JSON.stringify(val, undef, '  '));
        }
    }));

export default harden(repl);
