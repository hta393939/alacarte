
docker run \
  --rm \
  -v ${PWD}:/src \
  emscripten/emsdk \
  emcc --bind -o main.html \
    -DHSPEMSCRIPTEN \
    -s EXPORTED_FUNCTIONS="['_main','_malloc','_free']" \
    hspcmp/emscripten/hspcmp3.cpp
