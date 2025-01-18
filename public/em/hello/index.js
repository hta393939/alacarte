


class Misc {
  async initialize() {
    const res = await fetch('main.wasm');
    const ab = await res.arrayBuffer();

    const opt = {
      wasi_snapshot_preview1: {
        proc_exit: () => {},
      }
    };
    const source = await WebAssembly.instantiate(ab, opt);

    const Module = source.instance.exports;
    console.log('Module', Module);
    {
      const result = Module.add(1, 2);
      console.log('result', result);
    }
    {
      const start = Module.memory.buffer;
      const pointer = Module.malloc(4 * 16);
      const view = new Float32Array(start, pointer, 16);
      for (let i = 0; i < 16; ++i) {
        view[i] = i;
      }
      const result = Module.sum(view, 16);
      console.log('result', result, view);
    }
  }
}

const misc = new Misc();
globalThis.misc = misc;
misc.initialize();
