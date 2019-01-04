// The following imports are snarfed from quasiParserGenerator.
// TODO: They will need to be wrapped in a better API that can be
// implemented in Jessica.
import bootbnf from './quasiParserGenerator/src/bootbnf.js';
import sc from './quasiParserGenerator/src/scannerless.js';

// The rest of the compiler and environment is provided as Jessie
// modules in the Jessica library.
import bootEnv from '../../lib/boot-env.mjs';

function makeJessie(endowments) {
    // Make a bootstrap environment from the specified endowments.
    // We could take it apart with destructuring if we want to narrow
    // the endowments.
    return bootEnv(endowments, bootbnf, sc);
}

export default def(makeJessie);
