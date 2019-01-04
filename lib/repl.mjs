const repl = (endowments, asset) =>
    // Read...
    def(asset
    // Eval ...
    .then(data => confine(data, endowments, {scriptName: asset}))
    // Execute as main, if a function.
    .then(main => (main instanceof Function) ? main(ARGV) : main)
    // ... maybe Print.
    .then(val => {
        if (val !== undefined) {
            console.log(JSON.stringify(val, undef, '  '));
        }
    }));

export default def(repl);
