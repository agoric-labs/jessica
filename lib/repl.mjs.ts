const repl = (file: string,
              computedSet: (obj: Record<string | number, any>, index: string | number, val: any) => void,
              readInput: (file: string) => Promise<string>,
              doEval: (data: string, uri: string) => Promise<any>,
              writeOutput: (file: string, data: string) => void,
              argv: string[]) =>
    // Read...
    harden(readInput(file)
    // Eval ...
    .then(data => doEval(data, file))
    // Execute as main, if a function.
    .then(main => (typeof main === 'function') ?
        main({computedSet, readInput, writeOutput}, argv) : main)
    // ... maybe Print.
    .then(val => {
        if (val !== undefined) {
            writeOutput('-', JSON.stringify(val, undefined, '  ') + '\n');
        }
    }));

export default harden(repl);
