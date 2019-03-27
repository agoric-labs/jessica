:; cd `dirname "$0"` || exit $?
:; exec ./lang/nodejs/tessc.bat lib/*.mjs.ts
:; exit $?
