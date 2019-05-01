:; cd `dirname "$0"` || exit $?
:; (cd ../.. && { test -d ./node_modules/@agoric/jessie || npm install; }) || exit $?
:; test -d ./node_modules/parcel-bundler || npm install || exit $?
:; rm -rf dist
:; exec ./node_modules/.bin/parcel build --no-minify --public-url=./ --global=jessica ./index.html
:; exit $?
