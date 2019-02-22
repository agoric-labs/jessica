:; set -e
:; cd `dirname "$0"`
:; tsc
:; for f in esm/*.mjs.js; do mv $f `echo "$f" | sed -e 's/\.js$//'` || exit $?; done