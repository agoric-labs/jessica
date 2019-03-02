import makeLoadAsset from './loadAsset.mjs';
import repl from './repl.mjs';

interface IPower {
    loadAsset: (asset: string) => Promise<string>;
    writeOutput: (asset: string, data: string) => Promise<void>;
}

function jesspipe(power: IPower, argv: string[]) {
    const endowments = {
        bond,
        confine,
        confineExpr,
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

    const loadAsset = makeLoadAsset(CAN_LOAD_ASSETS, power.loadAsset);

    const doEval = (src: string, asset: string) =>
        Promise.resolve(confine(src, endowments, {scriptName: asset}));
    repl(MODULE, loadAsset, doEval, power.writeOutput, ARGV)
    .catch(e => {
      power.writeOutput('-', '/* FIXME: Stub */\n');
      slog.error`Cannot evaluate ${JSON.stringify(MODULE)}: ${e}`;
    });
}

export default jesspipe;
