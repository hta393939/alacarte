
const _pad = (v, n = 2) => {
  return new String(v).padStart(n, '0');
};

class Misc {
  constructor() {
    this.dst = '';
    this.startcount = 0;
    this.addcount = 1;
    /**
     * 出力数
     */
    this.outcount = 1;
    this.maxcount = -1;
    this.dstdh = null;
    this.prefix = 'data';
  }

  async initialize() {
    this.setListener();
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

  makeFilename(num) {
    return `${this.prefix}${_pad(num, this.num)}.${this.ext}`;
  }

  /**
   * 1GB分+16個を作成する
   * @returns 
   */
  readyBuffer() {
    const g1 = 0x400 * 0x400 * 0x400;
    const num = g1 / 4 + 16;
    const buf = new Uint32Array(num);
    for (let i = 0; i < num; ++i) {
      let val = Math.random() * 0xffffffff;
      buf[i] = val;
    }
    return buf;
  }

  async outputOne() {
    const isG = document.getElementById('isg')?.checked;
    const num = Number.parseFloat(document.getElementById('mul')?.value);

    const dirh = null;
    const name = `${this.prefix}_${_pad(100, 5)}.dat`;
    const fh = await dirh.getEntry();
    await this.writeOneFile(isG, num, fh);
  }

  /**
   * 1個書き出す
   * @param {boolean} isG 1GB単位か128MB単位か
   * @param {number} num 個数
   * @param {FileSystemFileHandle} fh
   */
  async writeOneFile(isG, num, fh) {
    console.log('writeOneFile');
    let unit = isG ? 0x400 * 0x400 * 0x400 : 0x400 * 0x400 * 128;
    await this.writeFile(fh, this.buf, unit, num);
    console.log('writeOneFile');
  }

  /**
   * 
   * @param {FileSystemFileHandle} fh 
   * @param {ArrayBuffer} buf 
   * @param {number} unit 塊バイト数
   * @param {number} mul 
   */
  async writeFile(fh, buf, unit, mul) {
    const ws = await fh.createWritable();
    for (let i = 0; i < mul; ++i) {
      const view = buf.slice(i, i + unit);
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

    { // ワーキングディレクトリで指定するタイプ。うまくいく。
      const el = document.getElementById('opendir');
      el?.addEventListener('click', async () => {
        const dirHandle = await this.openDir();
        this.dirHandle = dirHandle;
        await this.processDir(dirHandle);
      });
    }
    { // リトライ
      const el = document.getElementById('retry');
      el?.addEventListener('click', async () => {
        await this.processDir(this.dirHandle);
      });
    }

    for (const k of ['startcount', 'addcount', 'outcount']) {
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
