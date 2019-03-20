const repl = (file, setComputedIndex, readInput, doEval, writeOutput, argv) => 
// Read...
harden(readInput(file)
    // Eval ...
    .then(data => doEval(data, file))
    // Execute as main, if a function.
    .then(main => (typeof main === 'function') ?
    main({ setComputedIndex, readInput, writeOutput }, argv) : main)
    // ... maybe Print.
    .then(val => {
    if (val !== undefined) {
        writeOutput('-', JSON.stringify(val, undefined, '  ') + '\n');
    }
}));
export default harden(repl);
