:; cd `dirname "$0"` || exit $?
:; set -e
:; ./build.bat
:; ./lang/browser/build.bat
:; rm -rf docs/jessie-frame/
:; cp -r lang/browser/dist docs/jessie-frame
:; exit $?
