:; thisdir=`dirname "$0"`;echo 1>&2;exec node --experimental-modules "$thisdir/jesspipe.mjs" ${1+"$@"}
:; echo 1>&2 "Failed!";exit 1
@echo off
set thisdir=%~dp0
set arguments=%*
node --experimental-modules "%thisdir%\jesspipe.mjs" %arguments%
