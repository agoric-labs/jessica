:; set -e
:; thisdir=`dirname "$0"`;
:; aparent=`cd "$thisdir/../.." && pwd`
:; test -d "$aparent/node_modules/ses" && test -d "$aparent/node_modules/ts-node" || { cd "$aparent" && npm install 1>&2; }
:; curdir=`pwd`
:; reldir=`echo "$aparent/lang/nodejs" | sed -e "s!^$curdir/!!;"' s!\(.\)$!\1/!'`
:; exec "$aparent/node_modules/.bin/ts-node" -P "${reldir}/tsconfig.json" "${reldir}/jesspipe.ts" ${1+"$@"}
:; echo 1>&2 "Failed!";exit 1
@echo off
set thisdir=%~dp0
set arguments=%*
node --require esm "%thisdir%\jesspipe.mjs" %arguments%
