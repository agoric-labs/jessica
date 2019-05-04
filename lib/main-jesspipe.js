import { insulate } from '@agoric/jessie'; import { makeSet } from '@agoric/jessie';
import { slog as $i_slog } from '@michaelfig/slog';const slog = insulate($i_slog);

import $i_bootJessica from './boot-jessica.js';const bootJessica = insulate($i_bootJessica);
import $i_makeReadInput from './readInput.js';const makeReadInput = insulate($i_makeReadInput);
import $i_repl from './repl.js';const repl = insulate($i_repl);

const jesspipe = insulate((deps, argv) => {
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

  const jessica = bootJessica(deps.applyMethod, readInput, deps.setComputedIndex);

  const doEval = (src, uri) =>
  jessica.runModule(src, {}, { scriptName: uri });
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

export default jesspipe;