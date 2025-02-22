/**
 * @file index.js
 */

const _pad = (v, n = 2) => {
  return String(v).padStart(n, '0');
};

class Misc {
  constructor() {
  }

  /**
   * 初期化する
   */
  async initialize() {
    this.setListener();
  }

  /**
   * 
   * @param {File} file 
   */
  async gzip(file) {
    const cs = new CompressionStream('gzip');
    const ab = await file.arrayBuffer();
    const stream = new Response(ab).body.pipeThrough(cs);
    const conv = await new Response(stream).arrayBuffer();
    console.log('compress', conv.byteLength);
    return conv;
  }

  /**
   * 
   * @param {File} file 
   */
  async ungzip(file) {
    const ds = new DecompressionStream('gzip');
    const ab = await file.arrayBuffer();
    const stream = new Blob([ab]).stream().pipeThrough(ds);
    const conv = await new Response(stream).arrayBuffer();
    console.log('uncompressed', conv.byteLength);
    return conv;
  }

  setListener() {
    const handleDrag = (ev, type) => {
      ev.preventDefault();
      ev.stopPropagation();
      ev.dataTransfer.dropEffect = type;
    };
    {
      const el = window;
      el?.addEventListener('dragover', (ev) => {
        handleDrag(ev, 'none');
      });
      el?.addEventListener('drop', ev => {
        handleDrag(ev, 'none');
      });
    }
    {
      const el = document.getElementById('compress');
      el?.addEventListener('dragover', (ev) => {
        handleDrag(ev, 'copy');
      });
      el?.addEventListener('drop', async ev => {
        handleDrag(ev, 'copy');
        const file = ev.dataTransfer.files[0];
        const ab = await this.gzip(file);
        this.downloadFile(new Blob([ab]), `${file.name}.gz`);
      });
    }
    {
      const el = document.getElementById('decomp');
      el?.addEventListener('dragover', ev => {
        handleDrag(ev, 'copy');
      });
      el?.addEventListener('drop', async ev => {
        handleDrag(ev, 'copy');
        const re = /(?<base>.+)(?<ext>\..+)$/;
        const file = ev.dataTransfer.files[0];
        const ab = await this.ungzip(file);
        const m = re.exec(file.name);
        let name = `a.dat`;
        if (m) {
          name = `${m.groups['base']}`;
        }
        this.downloadFile(new Blob([ab]), name);
      });
    }

  }

  /**
   * 
   * @param {Blob} blob 
   * @param {string} name 
   */
  downloadFile(blob, name) {
    console.log('downloadFile', blob.size, name);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
  }

}

const misc = new Misc();
misc.initialize();
