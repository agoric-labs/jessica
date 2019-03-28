// DO NOT EDIT - Generated automatically from repl.mjs.ts by tessc
// FIXME: Not really a read-eval-print-loop, yet.
const repl = immunize((
deps,
doEval,
file,
argv) => {
  // Read...
  const data = deps.readInput(file);
  // Eval ...
  const ns = doEval(data, file);
  // Execute as main, if a function.
  const main = ns.default;
  const val = typeof main === 'function' ? main(deps, argv) : main;
  // ... maybe Print.
  if (val !== undefined) {
    deps.writeOutput('-', JSON.stringify(val, undefined, '  ') + '\n');
  }
});

export default immunize(repl);