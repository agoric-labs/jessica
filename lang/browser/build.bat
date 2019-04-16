:; cd `dirname "$0"` || exit $?
:; test -d ./node_modules/parcel-bundler || npm install || exit $?
:; rm -rf dist
:; exec ./node_modules/.bin/parcel build --no-minify --public-url=./ --global=jessica ./index.html
:; exit $?
