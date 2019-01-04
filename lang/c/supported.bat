:; thisdir=`dirname "$0"`; echo "int main() {return 1;}" > "$thisdir/testc.c" && cc -g -O2 "$thisdir/testc.c" -o "$thisdir/testc.exe" && "$thisdir/testc.exe"
:; status=$?; rm -rf "$thisdir"/testc.*; exit $status
@echo off
set thisdir=%~dp0
set arguments=%*
echo Not implemented for Windows
exit 1
