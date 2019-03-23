// FIXME: Not really a read-eval-print-loop, yet.
const repl = (
        deps: IMainDependencies,
        doEval: (data: string, uri: string) => any,
        file: string,
        argv: string[]) => {
    // Read...
    const data = deps.readInput(file);
    // Eval ...
    const main = doEval(data, file);
    // Execute as main, if a function.
    const val = typeof main === 'function' ? main(deps, argv) : main;
    // ... maybe Print.
    if (val !== undefined) {
        deps.writeOutput('-', JSON.stringify(val, undefined, '  ') + '\n');
    }
};

export default repl;
