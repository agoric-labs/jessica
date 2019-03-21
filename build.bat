:; cd `dirname "$0"` || exit $?
:; status=0
:; lang/nodejs/tse.bat lib/*.mjs.ts || status=$?
:; for f in lib/*.mjs.js; do test -f "$f" || continue; mv "$f" `echo "$f" | sed -e 's/\.js$//'`; done
:; exit $status

