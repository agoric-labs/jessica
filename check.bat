:; thisdir=`dirname "$0"`; status=0; # set -x
:; langs=${1+"$@"}
:; test -n "$langs" || langs=`cd "$thisdir"/lang && echo *`
:; mkdir -p "$thisdir/checkout"
:; for lang in $langs; do
:;  echo "==== Checking for $lang support"
:;  "$thisdir/lang/$lang/supported.bat" || continue
:;  check="$thisdir/lang/$lang/check.bat"
:;  test ! -f "$check" || "$check" || { status=$la?; break; }
:;  for emitter in "$thisdir"/lib/emit-*.mjs; do
:;    target=`echo "$emitter" | sed -e 's/.*\/emit-//; s/\.mjs$//'`
:;    sfx=`cat "$thisdir/lang/$target/.suffix"`
:;    out="$thisdir/checkout/${lang}2$target.$sfx"
:;    echo "==== Run $lang's jesspipe $emitter to generate $out";
:;    "$thisdir/lang/$lang/jesspipe.bat" "$emitter" -- "$thisdir"/lib/*.mjs > "$out" || { status=$?; break; }
:;    diff -u "$thisdir/lang/$target/jessica.$sfx" "$out" || { status=$?; break; }
:;    out="$thisdir/checkout/m${lang}2$target.$sfx"
:;    echo "==== Run $lang's meta jesspipe $emitter to generate ${out}"
:;    "$thisdir/lang/$lang/jesspipe.bat" "$thisdir/lib/main-jesspipe.mjs" -- "$emitter" -- "$thisdir"/lib/*.mjs > "$out" || { status=$?; break; }
:;    diff -u "$thisdir/lang/$target/jessica.$sfx" "$out" || { status=$?; break; }
:;  done
:; done
:; exit $status
@echo off
set thisdir=%~dp0
set arguments=%*
echo Not implemented for Windows yet.
