:; thisdir=`dirname "$0"`;
:; test -d "$thisdir/node_modules/typescript" || (cd "$thisdir" && npm install 1>&2)
:; test "$thisdir/tse.js" -nt "$thisdir/tse.ts" || (cd "$thisdir" && tsc -p ./tsconfig.tse.json --outDir .)
:; exec node "$thisdir/tse.js" ${1+"$@"}
:; echo 1>&2 "Failed!";exit 1
@echo off
set thisdir=%~dp0
set arguments=%*
node --require esm "%thisdir%\jesspipe.mjs" %arguments%
