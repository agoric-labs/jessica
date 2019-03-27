// DO NOT EDIT - Generated automatically from main-jesspipe.mjs.ts by tessc
import $i_bootEnv from './boot-env.mjs';const bootEnv = immunize($i_bootEnv);
import $i_makeReadInput from './readInput.mjs';const makeReadInput = immunize($i_makeReadInput);
import $i_repl from './repl.mjs';const repl = immunize($i_repl);

const jesspipe = immunize((deps, argv) => {
  const globalEnv = {
    confine,
    confineExpr,
    eval,
    immunize,
    makeMap,
    makePromise,
    makeSet,
    makeWeakMap,
    makeWeakSet,
    slog };


  // Read and evaluate the specified module,
  if (argv.length < 3) {
    slog.panic`You must specify a MODULE`;
  }
  const MODULE = argv[2] || '-';
  const ARGV = argv.slice(2);

  // Make a confined file loader specified by the arguments.
  const dashdash = ARGV.indexOf('--');
  const CAN_LOAD_FILES = makeSet([MODULE]);
  if (dashdash >= 0) {
    ARGV.slice(dashdash + 1).forEach(file => CAN_LOAD_FILES.add(file));
  }

  const readInput = makeReadInput(CAN_LOAD_FILES, deps.readInput);

  // Make a confined file writer.
  const writeOutput = (fname, str) => {
    if (fname !== '-') {
      slog.error`Cannot write to ${{ fname }}: must be -`;
    }
    return deps.writeOutput('-', str);
  };

  // Create a Jessie bootstrap environment for the endowments.
  const jessie = bootEnv(globalEnv, deps.applyMethod, readInput, deps.setComputedIndex);

  const doEval = (src, uri) =>
  jessie.confine(src, jessie, { scriptName: uri });
  const newDeps = {
    applyMethod: deps.applyMethod,
    readInput,
    setComputedIndex: deps.setComputedIndex,
    writeOutput };

  try {
    repl(newDeps, doEval, MODULE, ARGV);
  } catch (e) {
    deps.writeOutput('-', '/* FIXME: Stub */\n');
    slog.notice`Cannot evaluate ${{ MODULE }}: ${e}`;
  }
});

export default immunize(jesspipe);