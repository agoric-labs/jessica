const repl = (file: string,
              readInput: (file: string) => Promise<string>,
              doEval: (data: string, uri: string) => Promise<any>,
              writeOutput: (file: string, data: string) => void,
              argv: string[]) =>
    // Read...
    harden(readInput(file)
    // Eval ...
    .then(data => doEval(data, file))
    // Execute as main, if a function.
    .then(main => (typeof main === 'function') ? main({readInput, writeOutput}, argv) : main)
    // ... maybe Print.
    .then(val => {
        if (val !== undefined) {
            writeOutput('-', JSON.stringify(val, undefined, '  ') + '\n');
        }
    }));

export default harden(repl);
