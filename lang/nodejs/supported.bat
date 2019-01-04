:; node --experimental-modules --version; exit $?
@echo off
set thisdir=%~dp0
set arguments=%*
node --experimental-modules --version
