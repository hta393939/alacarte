/**
 * 不透明の絵をscale倍でドット絵拡大する
 */
class Misc {
  constructor() {
    /**
     * UIで値を変更する
     */
    this.scale = 4;
    this.cellx = 0;
    this.celly = 0;
    this.cellw = 64;
    this.cellh = 64;
    this.offsetx = 0;
    this.stepx = 4;
    this.offsety = 0;
    this.stepy = 4;
  }

  async initialize() {
    this.setListener();
  }

  /**
   * 
   * @param {HTMLCanvasElement} src 
   */
  scaleImage(src) {
    const scale = this.scale;

    const cellx = this.cellx;
    const celly = this.celly;
    const cellw = this.cellw;
    const cellh = cellw;

    /**
     * 入力画像の幅
     */
//        const w = src.width;
//        const h = src.height;
    const context = src.getContext('2d');
    /**
     * 書き出し先
     * @type {HTMLCanvasElement}
     */
    const canvas = document.getElementById('subcanvas');
    const c = canvas.getContext('2d');
    canvas.width = cellw * scale;
    canvas.height = cellh * scale;
    const cx = cellx * cellw;
    const cy = celly * cellh;
    console.log(cx, cy, cellw, cellh);
    const dat = context.getImageData(cx, cy, cellw, cellh);

    let backs = [-1, -1, -1];
    if (true) { // 左上を背景色として採用する
      let ft = (0 + 0 * 0) * 4;
      backs[0] = dat.data[ft];
      backs[1] = dat.data[ft+1];
      backs[2] = dat.data[ft+2];
    }

    for (let i = 0; i < cellw; ++i) {
      for (let j = 0; j < cellw; ++j) {
        let ft = (j + i * cellw) * 4;
        let x = j * scale;
        let y = i * scale;
        let r = dat.data[ft];
        let g = dat.data[ft+1];
        let b = dat.data[ft+2];
        let a = dat.data[ft+3];
        if (r === backs[0] && g === backs[1] && b === backs[2]) {
          a = 0;
        }
        c.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
        c.fillRect(x, y, scale, scale);
      }
    }
  }

  /**
   * 
   * @param {File} file 
   */
  async parseImage(file) {
    const img = new Image();
    img.addEventListener('load', () => {
      /** @type {HTMLCanvasElement} */
      const canvas = document.getElementById('maincanvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const c = canvas.getContext('2d');
      c.drawImage(img, 0, 0);
      this.scaleImage(canvas);
    });
    img.src = URL.createObjectURL(file);
  }

  setListener() {
    {
      const el = window;
      el.addEventListener('dragover', ev => {
        ev.preventDefault();
        ev.stopPropagation();
        ev.dataTransfer.dropEffect = 'copy';
      });
      el.addEventListener('drop', ev => {
        ev.preventDefault();
        ev.stopPropagation();
        ev.dataTransfer.dropEffect = 'copy';
        this.parseImage(ev.dataTransfer.files[0]);
      });
    }

    for (const k of [
      'scale', 'cellx', 'celly', 'cellw',
      'offsetx', 'stepx', 'offsety', 'stepy',
    ]) {
      const el = document.getElementById(`${k}`);
      const viewel = document.getElementById(`${k}view`);
      const _update = () => {
        this[k] = Number.parseFloat(el.value);
        viewel.textContent = this[k];
      };
      el?.addEventListener('input', () => {
        _update();
      });
      _update();
    }

  }

  updatePick() {
    /** @type {HTMLCanvasElement} */
    const srccanvas = document.getElementById('maincanvas');
    const sw = srccanvas.width;
    const sh = srccanvas.height;
    /** @type {HTMLCanvasElement} */
    const dstcanvas = document.getElementById('subcanvas');
    const dw = Math.floor((sw - this.offsetx) / this.stepx);
    const dh = Math.floor((sh - this.offsety) / this.stepy);
    dstcanvas.width = dw;
    dstcanvas.height = dh;
    const srcc = srccanvas.getContext('2d');
    const srcimg = srcc.getImageData(0, 0, sw, sh);
    const dstc = dstcanvas.getContext('2d');
    const dstimg = dstc.getImageData(0, 0, dw, dh);

    for (let i = 0; i < dh; ++i) {
      for (let j = 0; j < dw; ++j) {
        let sx = j * this.stepx + this.offsetx;
        let sy = i * this.stepy + this.offsety;
        let dx = j;
        let dy = i;
        let srcoffset = (sw * sy + sx) * 4;
        let dstoffset = (dw * dy + dx) * 4;
        let r = srcimg.data[srcoffset];
        let g = srcimg.data[srcoffset+1];
        let b = srcimg.data[srcoffset+2];
        let a = srcimg.data[srcoffset+3];
        dstimg.data[dstoffset] = r;
        dstimg.data[dstoffset+1] = g;
        dstimg.data[dstoffset+2] = b;
        dstimg.data[dstoffset+3] = a;
      }
    }
    dstc.putImageData(dstimg, 0, 0);
  }

}

const misc = new Misc();
misc.initialize();

