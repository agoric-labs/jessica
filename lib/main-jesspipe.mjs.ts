import makeReadInput from './readInput.mjs';
import repl from './repl.mjs';

function jesspipe(deps: IMainDependencies, argv: string[]) {
    const endowments = {
        bond,
        confine,
        confineExpr,
        eval,
        harden,
        makeMap,
        makePromise,
        makeSet,
        makeWeakMap,
        makeWeakSet,
        slog,
    };

    // Read and evaluate the specified module,
    if (argv.length < 2) {
        slog.panic`You must specify a MODULE`;
    }
    const MODULE = argv[1] || '-';
    const ARGV = argv.slice(1);

    // Make a confined file loader specified by the arguments.
    const dashdash = ARGV.indexOf('--');
    const CAN_LOAD_FILES = makeSet([MODULE]);
    if (dashdash >= 0) {
        ARGV.slice(dashdash + 1).forEach(file => CAN_LOAD_FILES.add(file));
    }

    const readInput = makeReadInput(CAN_LOAD_FILES, deps.readInput);

    const doEval = (src: string, file: string) =>
        Promise.resolve(confine(src, endowments, {scriptName: file}));
    repl(MODULE, (file) => Promise.resolve(readInput(file)), doEval,
        deps.writeOutput, ARGV)
    .catch(e => {
      deps.writeOutput('-', '/* FIXME: Stub */\n');
      slog.warn`Cannot evaluate ${JSON.stringify(MODULE)}: ${e}`;
    });
}

export default jesspipe;
