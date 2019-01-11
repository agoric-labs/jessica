* Use full SES!

* See [Jessie this-capture issue](https://github.com/Agoric/Jessie/issues/19) and excise:

```javascript
foo.bar = other.obj.index;
(1,foo.bar)(baz)
```

in callers avoiding `this`-capture in favour of protecting callees:
```javascript
foo.bar = bond(other.obj, 'index');
foo.bar(baz)
``` 

* Endow `slog` instead of `console.log` and `console.error`.  Also change `jesspipe` to use a `loadAsset` and `outputStream`.

* Snarf the whitelist.js libraries.

* boot-peg doesn't identify syntax errors correctly.  Problem with tokenTypeList, which needs to match literals.

* Better document quasi-peg.mjs, especially the < foo > syntax and val0 wrapper for seq.

* Refactor and clean up boot-peg.mjs.  peg-utils.mjs is a possibility.
