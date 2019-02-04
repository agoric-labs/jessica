:; thisdir=`dirname "$0"`;
:; test -d "$thisdir/node_modules/esm" && test -d "$thisdir/node_modules/ses" || { cd "$thisdir" && npm install; }
:; NODE_PATH="$thisdir/node_modules:$NODE_PATH" exec node --require esm "$thisdir/jesspipe.mjs" ${1+"$@"}
:; echo 1>&2 "Failed!";exit 1
@echo off
set thisdir=%~dp0
set arguments=%*
node --require esm "%thisdir%\jesspipe.mjs" %arguments%
