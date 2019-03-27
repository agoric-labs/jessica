:; thisdir=`dirname "$0"`;
:; test -d "$thisdir/node_modules/@babel/core" || (cd "$thisdir" && npm install 1>&2)
:; exec node "$thisdir/tessc.js" ${1+"$@"}
:; echo 1>&2 "Failed!";exit 1
@echo off
set thisdir=%~dp0
set arguments=%*
node "%thisdir%\tessc.js" %arguments%
