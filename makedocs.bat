:; cd `dirname "$0"` || exit $?
:; set -e
:; ./build.bat
:; ./lang/browser/build.bat
:; cp lang/browser/jessica.js* docs
:; sed -e 's%\./jessica.mjs%../jessica.js%' lang/browser/index.html > node_modules/t.html
:; cp node_modules/t.html docs/jessie-frame/index.html
:; exit $?
