* '\xFF' syntax for Justin?

* Update `writeOutput` and `readInput` to be incremental (i.e. it can be called again to append to output or read next line from stdin).  Use them to implement a true repl.

* Snarf the whitelist.js libraries for nodejs.

* Use full SES!

* boot-peg doesn't identify syntax errors correctly.  Problem with tokenTypeList, which needs to match literals.

* Better document quasi-peg.mjs, especially the < foo > syntax and SKIP.

* Refactor and clean up boot-peg.mjs.  peg-utils.mjs is a possibility.

* Consider allowing `writeOutput` to create files if they are whitelisted in the `jesspipe` command line options.
