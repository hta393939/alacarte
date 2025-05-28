
const _pad = (v, n = 2) => {
  return new String(v).padStart(n, '0');
};

class Misc {
  constructor() {
    this.dst = '';
    /**
     * カウンタ
     */
    this.count = 0;
    /**
     * カウンタ
     */
    this.startcount = 0;
    this.addcount = 1;
    /**
     * 出力数
     */
    this.outcount = 1;
    this.maxcount = -1;
    /**
     * @type {FileSystemDirectoryHandle}
     */
    this.dstdh = null;
    this.prefix = 'd_';
    /**
     * @type {Uint8Array}
     */
    this.buf = null;
  }

  async initialize() {
    this.setListener();
  }

  async openDir() {
    const opt = { mode: 'readwrite' };
    const dirh = await window.showDirectoryPicker(opt);
    return dirh;
  }

  /**
   * 
   * @param {FileSystemDirectoryHandle} dirHandle 
   */
  async processDir(dirHandle) {
    this.root = dirHandle;
    this.addcount = Number.parseFloat(document.getElementById('idaddcount')?.value || 1);
    this.src = document.getElementById('idsrc')?.value ?? 'src';
    this.dst = document.getElementById('iddst')?.value ?? 'dst';

    const result = this.analyzeDir();
    if (!result) {
      console.warn('analyze failure');
      return;
    }
    Object.assign(this, result);

    this.skipSelect();
  }

  /**
   * 1GB分+16バイトを作成する
   * @returns 
   */
  readyBuffer() {
    const g1 = 0x400 * 0x400 * 0x400;
    const num = g1 + 16;
    const buf = new Uint8Array(num);
    const view = new DataView(buf.buffer);
    //const view = new Uint32Array(buf, 0, num / 4);
    for (let i = 0; i < num / 4; ++i) {
      let val = Math.random() * 0xffffffff;
      view.setUint32(i * 4, val, true);
    }
    return buf;
  }

  async outputOne() {
    console.log('outputOne');

    const isG = document.getElementById('isg')?.checked;
    const num = Number.parseFloat(document.getElementById('mul')?.value);

    if (!Number.isFinite(num)) {
      return;
    }
    if (!this.buf) {
      this.buf = this.readyBuffer();
    }

    /**
     * @type {FileSystemDirectoryHandle}
     */
    const dirh = this.dstdh;
    for (let i = 0; i < 10; ++i) {
      const name = `${this.prefix}_${_pad(this.count, 5)}.dat`;
      this.count += 1;
      try {
        const fh = await dirh.getFileHandle(name, { create: false });
        console.log('exist', name);
        continue;
      } catch (e) {
        // Do nothing.
      }
      const fh = await dirh.getFileHandle(name, { create: true });
      await this.writeOneFile(isG, num, fh);
      break;
    }
  }

  /**
   * 1個書き出す
   * @param {boolean} isG 1GB単位か128MB単位か
   * @param {number} num 個数
   * @param {FileSystemFileHandle} fh
   */
  async writeOneFile(isG, num, fh) {
    console.log('writeOneFile');
    //let unit = isG ? 0x400 * 0x400 * 0x400 : 0x400 * 0x400 * 1;
    let unit = isG ? 0x400 * 0x400 * 0x400 : 0x400 * 0x400 * 16;
    await this.writeFile(fh, this.buf, unit, num);
    console.log('writeOneFile');
  }

  /**
   * 
   * @param {FileSystemFileHandle} fh 
   * @param {Uint8Array} buf 
   * @param {number} unit 塊バイト数
   * @param {number} mul 
   */
  async writeFile(fh, buf, unit, mul) {
    const ws = await fh.createWritable();
    for (let i = 0; i < mul; ++i) {
      const view = buf.subarray(i, i + unit);
      await ws.write(view);
    }
    await ws.close();
  }

  setListener() {
    {
      const el = document.body;
      el?.addEventListener('dragover', ev => {
        ev.preventDefault();
        ev.stopPropagation();
        ev.dataTransfer.dropEffect = 'none';
      });
      el?.addEventListener('drop', ev => {
        ev.preventDefault();
        ev.stopPropagation();
        ev.dataTransfer.dropEffect = 'none';
      });
    }
    {
      const el = document.querySelector('.drop');
      el?.addEventListener('dragover', ev => {
        ev.stopPropagation();
        ev.preventDefault();
        ev.dataTransfer.dropEffect = 'copy';
      });
      el?.addEventListener('drop', ev => {
        ev.stopPropagation();
        ev.preventDefault();
        //this.analyzeText(ev.dataTransfer.files[0]);
      });
    }

    { // ワーキングディレクトリで指定するタイプ。
      const el = document.getElementById('opendir');
      el?.addEventListener('click', async () => {
        const dirHandle = await this.openDir();
        this.dstdh = dirHandle;
      });
    }

    { // リトライ
      const el = document.getElementById('go1');
      el?.addEventListener('click', async () => {
        await this.outputOne();
      });
    }

    { // リトライ
      const el = document.getElementById('retry');
      el?.addEventListener('click', async () => {
        await this.processDir(this.dirHandle);
      });
    }

    for (const k of ['startcount', 'addcount', 'outcount', 'mul']) {
      const el = document.getElementById(k);
      const _update = () => {
        const val = Number.parseFloat(el.value);
        const viewel = document.getElementById(`${k}view`);
        if (viewel) {
          viewel.textContent = `${val}`;
        }
      };
      el?.addEventListener('input', _update);
      _update();
    }

  }

}

const misc = new Misc();
misc.initialize();
