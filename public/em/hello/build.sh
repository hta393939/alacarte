
docker run --rm \
  -v ${PWD}:/src \
  emscripten/emsdk:latest \
  emcc -s "FILESYSTEM=0" -s "EXPORTED_FUNCTIONS=['_malloc','_free']" -msimd128 -o main.wasm main.cpp

