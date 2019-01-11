* Use full SES!

* Endow `slog` instead of `console.log` and `console.error`.  Also change `jesspipe` to use a `loadAsset` and `outputStream`.

* Snarf the whitelist.js libraries.

* boot-peg doesn't identify syntax errors correctly.  Problem with tokenTypeList, which needs to match literals.

* Better document quasi-peg.mjs, especially the < foo > syntax and val0 wrapper for seq.

* Refactor and clean up boot-peg.mjs.  peg-utils.mjs is a possibility.
