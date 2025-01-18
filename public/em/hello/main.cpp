#include <emscripten.h>
#include <wasm_simd128.h>

EMSCRIPTEN_KEEPALIVE
extern "C" int sum(int pointer, int num) {
  auto p = (float*)pointer;

  int loopNum = num >> 2;
  v128_t coeff = wasm_f32x4_const(2.0f, 0.1f, 1.0f, 1.0f);
  for (int i = 0; i < loopNum; ++i) {
    v128_t v0 = wasm_v128_load(p);
    v128_t v1 = wasm_f32x4_mul(v0, coeff);
    wasm_v128_store(p, v1);
    p += 4;
  }
  return loopNum;
}

EMSCRIPTEN_KEEPALIVE
extern "C" int add(int a, int b) {
  return (a + b);
}

int main() {
  return 1;
}

