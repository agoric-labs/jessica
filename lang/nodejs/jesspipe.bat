:; thisdir=`dirname "$0"`;
:; test -d "$thisdir/node_modules/esm" && test -d "$thisdir/node_modules/ses" || (cd "$thisdir" && npm install 1>&2)
:; athisdir=`cd "$thisdir" && pwd`
:; curdir=`pwd`
:; reldir=`echo "$athisdir" | sed -e "s!^$curdir/!!;"' s!\(.\)$!\1/!'`
:; NODE_PATH="$athisdir/node_modules:$NODE_PATH" exec node --require esm "${reldir}jesspipe.js" ${1+"$@"}
:; echo 1>&2 "Failed!";exit 1
@echo off
set thisdir=%~dp0
set arguments=%*
node --require esm "%thisdir%\jesspipe.js" %arguments%
