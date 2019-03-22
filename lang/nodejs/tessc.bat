:; thisdir=`dirname "$0"`;
:; test -d "$thisdir/node_modules/typescript" || (cd "$thisdir" && npm install 1>&2)
:; test "$thisdir/tessc.js" -nt "$thisdir/tessc.ts" || (cd "$thisdir" && tsc -p ./tsconfig.tessc.json --outDir .)
:; exec node "$thisdir/tessc.js" ${1+"$@"}
:; echo 1>&2 "Failed!";exit 1
@echo off
set thisdir=%~dp0
set arguments=%*
node --require esm "%thisdir%\jesspipe.mjs" %arguments%
