
class Misc {
  constructor() {
    this.cur = null;
    this.tunes = null;

    this.volume100 = 50;

    this.clock = 1;
    this.radius = 1;
    this.lines = [];
  }

  /**
   * 
   * @param {string} str 
   */
  setProcessInfo(str) {
    const el = document.getElementById('processinfo');
    if (!el) {
      return;
    }
    //el.classList.add('');
    el.textContent = `${new Date().toLocaleTimeString()} ${str}`;
  }

  log(...args) {
    console.log(...args);

    const line = args.join(', ');
    this.lines.unshift(line);
    const el = document.getElementById('consoleview');
    if (!el) {
      return;
    }
    el.innerHTML = this.lines.join('<br />');
  }

  async initialize() {
    const sp = new URLSearchParams(location.search);
    for (const k of []) {
      if (!sp.has(k)) {
        continue;
      }
      let val = sp.get(k) || true;
      this[k] = val;
    }

    this.setListener();
  }

  setListener() {
    {
      const el = document.getElementById('startworkerfoo');
      el?.addEventListener('click', () => {
        this.initWorkerFoo();
      });
    }
    {
      const el = document.getElementById('inferbar');
      el?.addEventListener('click', () => {
        this.infer();
      });
    }

    {

      /**
       * 
       * @param {string} _type 
       * @returns 
       */
      const _mode = (_type) => {
        return (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          ev.dataTransfer.dropEffect = _type;
        };
      };

      document.body.addEventListener('dragover', _mode('none'));
      const el = document.querySelector('.drop');
      el?.addEventListener('dragover', _mode('link'));
      el?.addEventListener('drop', async ev => {
        _mode('link')(ev);

      });
    }

  }

  async ready() {
    let genId = 0;

    const BUILD = Date.now();
    /** ユーティリティ関数を含むモジュール */
    const mb = await import(`../hf/mb_runtime.js?v=${BUILD}`);

    const _makeTarget = (from) => {

    };

    const context = [3, 2, 1, 0].map(k => {
      mb.sampleFrames(clip,
        T - k / mb.fps,
        new Float32Array(pose.length))
    });
    const target = makeTarget(context[3]); // [new Float32Array(539), 1, 2, 3],
    genId += 1;
    const id = genId;

    const obj = {
      type: 'gen',
      context,
      id, // 32,
      opts: {smooth: 2},
      target,
    };
    // 77 * 7
    this.worker.postMessage(obj);

  }

  async initWorkerFoo() {
    const worker = new Worker(`../hf/mb_worker.js`);
    this.worker = worker;

    worker.addEventListener('message', ev => {
      const data = ev.data;
      switch (data.type) {
      case 'ready':
        // 準備した
        console.log('ready');
        break;
      case 'progress':
        console.log('progress...', data, data.total);
        break;
      case 'cached':
        console.log('cached', 'この後に再構築するらしい');
        break;
      case 'gen':
        // 作成した
        console.log('gen', data);
        // id: 32, frames: (14014), n: 26, tokens: 8, ms: obj 所要時間
        break;
      }
    });

    worker.postMessage({
      type: 'init',
      runtimeUrl: `../hf/soma_runtime.json`,
      modelUrl: `../hf/mmm_v6_soma_q8h.onnx`,
      ep: 'webgpu',
      //:'1.30.0',
    });
    console.log('initWorkerFoo');
  }

  async infer() {

  }

  /**
   * ardy, kimodo
   * kimodo
   * run,pickup
   */
  foo() {
    const meta = {total: 242732481, parts: 8};
  }

}

const misc = new Misc();
misc.initialize();
