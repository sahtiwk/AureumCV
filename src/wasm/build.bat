@echo off
setlocal
pushd "%~dp0\..\.."
call npm run build:wasm
set "build_result=%errorlevel%"
popd
exit /b %build_result%
