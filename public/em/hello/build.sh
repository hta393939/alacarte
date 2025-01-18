
docker run --rm \
  -v ${PWD}:/src \
  emscripten/emsdk:latest \
  emcc -s "INVOKE_RUN=0" -s "EXPORTED_FUNCTIONS=['_malloc','_free']" -msimd128 -o main.wasm main.cpp

