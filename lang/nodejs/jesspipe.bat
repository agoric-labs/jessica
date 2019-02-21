:; thisdir=`dirname "$0"`;
:; aparent=`cd "$thisdir/../.." && pwd`
:; test -d "$aparent/node_modules/ses" && test -d "$aparent/node_modules/esm" || { cd "$aparent" && npm install 1>&2; }
:; curdir=`pwd`
:; reldir=`echo "$aparent/lang/nodejs" | sed -e "s!^$curdir/!!;"' s!\(.\)$!\1/!'`
:; NODE_PATH="$aparent/node_modules:$NODE_PATH" exec node --require esm "${reldir}/jesspipe.mjs" ${1+"$@"}
:; echo 1>&2 "Failed!";exit 1
@echo off
set thisdir=%~dp0
set arguments=%*
node --require esm "%thisdir%\jesspipe.mjs" %arguments%
