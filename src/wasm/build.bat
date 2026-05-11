@echo off
set EM_CONFIG=C:\phi_calci\.emscripten
if not exist ..\..\public\wasm mkdir ..\..\public\wasm
echo Compiling geometry.cpp...
call emcc geometry.cpp -o ../../public/wasm/geometry.js -O3 -s MODULARIZE=1 -s EXPORT_NAME="createGeometryModule" -s ENVIRONMENT=web -s EXPORTED_FUNCTIONS="['_malloc', '_free']"
echo Done.
