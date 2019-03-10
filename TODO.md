* '\xFF' syntax for peg Tags and Justin.  Excise octal.

* Use '**' more effectively, since it allows zero-or-more instances.

* Use full SES!

* Consider allowing `writeOutput` to create files if they are whitelisted in the `jesspipe` command line options.

* Snarf the whitelist.js libraries.

* boot-peg doesn't identify syntax errors correctly.  Problem with tokenTypeList, which needs to match literals.

* Better document quasi-peg.mjs, especially the < foo > syntax and SKIP.

* Refactor and clean up boot-peg.mjs.  peg-utils.mjs is a possibility.
