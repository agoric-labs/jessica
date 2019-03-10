import makeReadInput from './readInput.mjs';
import repl from './repl.mjs';
function jesspipe(deps, argv) {
    const endowments = {
        bond,
        confine,
        confineExpr,
        eval,
        harden,
        makeError,
        makeMap,
        makePromise,
        makeSet,
        makeWeakMap,
        makeWeakSet,
        slog,
    };
    // Read and evaluate the specified module,
    if (argv.length < 2) {
        throw makeError(`You must specify a MODULE`);
    }
    const MODULE = argv[1] || '-';
    const ARGV = argv.slice(1);
    // Make a confined file loader specified by the arguments.
    const dashdash = ARGV.indexOf('--');
    const CAN_LOAD_ASSETS = makeSet([MODULE]);
    if (dashdash >= 0) {
        ARGV.slice(dashdash + 1).forEach(file => CAN_LOAD_ASSETS.add(file));
    }
    const readInput = makeReadInput(CAN_LOAD_ASSETS, deps.readInput);
    const doEval = (src, asset) => Promise.resolve(confine(src, endowments, { scriptName: asset }));
    repl(MODULE, readInput, doEval, deps.writeOutput, ARGV)
        .catch(e => {
        deps.writeOutput('-', '/* FIXME: Stub */\n');
        slog.error `Cannot evaluate ${JSON.stringify(MODULE)}: ${e}`;
    });
}
export default jesspipe;
