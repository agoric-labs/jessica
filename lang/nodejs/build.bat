:; cd `dirname "$0"` || exit $?
:; rm -rf tsout
:; tsc -p . --outDir tsout
:; for f in tsout/lang/nodejs/*.js; do test -f "$f" || continue; mv "$f" `echo "$f" | sed -e 's!^.*/\(.*\)\.js$!\1!'`; done
:; rm -rf tsout
