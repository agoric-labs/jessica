:; cd `dirname "$0"` || exit $?
:; (cd ../.. && { test -d ./node_modules/@agoric/jessie || npm install; }) || exit $?
:; test -d ./node_modules/typescript || npm install || exit $?
:; status=0
:; rm -rf tsout
:; ./node_modules/.bin/tsc -p ./tsconfig.app.json --outDir tsout || status=$?
:; for f in tsout/lang/nodejs/*.js; do test -f "$f" || continue; mv "$f" `echo "$f" | sed -e 's!^.*/\(.*\.js\)\.js$!\1!; s!^.*/\(.*\.js\)$!\1!'`; done
:; rm -rf tsout
:; exit $status
