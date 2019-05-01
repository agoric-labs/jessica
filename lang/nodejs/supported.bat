:; exit 1 # FIXME: Temporary disable
:; node --version; exit $?
@echo off
set thisdir=%~dp0
set arguments=%*
node --version
