:; thisdir=`dirname "$0"`;srcs="jesspipe.c";exe="jesspipe.exe"
:; (cd "$thisdir" && for src in $srcs *.h `basename "$0"`; do test "$exe" -nt "$src" || { cc -g -O2 -I. -o "$exe" $srcs; exit $?; }; done) || exit $?
:; exec "$thisdir/$exe" ${1+"$@"}
:; echo 'Failed to exec' 1>&2; exit 1
@echo off
set thisdir=%~dp0
set arguments=%*
echo Windows C is not implemented yet!
