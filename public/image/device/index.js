/**
 * @file index.js
 */

class Misc {
  constructor() {
  }

  async initialize() {
    this.setListener();

    this.draw();
  }

  draw() {
    const w = 256;
    const h = 256;
    const size = 32;
    /**
     * @type {HTMLCanvasElement}
     */
    const canvas = document.getElementById('subcanvas');
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext('2d');
    c.fillStyle = '#ddddcc';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#cccccc';
    for (let i = 0; i < 16; ++i) {
      for (let j = 0; j < 16; ++j) {
        const val = (j & 1) + (i & 1);
        if (val & 1) {
          continue;
        }
        c.fillRect(i * size, j * size, size, size);
      }
    }
  }

  setListener() {
    const qs = document.querySelectorAll('.live');
    for (const el of qs) {
      const k = el.id;
      const viewel = document.getElementById(`${k}view`);
      const _update = () => {
        const val = Number.parseFloat(el.value);
        this[k] = Number.isFinite(val) ? val : el.value;

        if (viewel) {
          viewel.textContent = this[k];
        }
      };

      //_update();
    }

    {
      const el = document.body;
      el?.addEventListener('click', () => {
        this.fullscreen();
      });
    }

    this.ready();
  }

  async fullscreen() {
    await document.body.requestFullscreen();
  }

  ready() {
    const canvas = document.getElementById('maincanvas');
    const dpr = window.devicePixelRatio;
    const cw = document.documentElement.clientWidth;
    const ch = document.documentElement.clientHeight;
    const w = Math.ceil(cw * dpr);
    const h = Math.ceil(ch * dpr);
    canvas.width = w;
    canvas.height = h;

    const c = canvas.getContext('2d');
    c.fillStyle = 'black';
    c.fillRect(0, 0, w, h);

    c.strokeStyle = 'white';
    c.lineWidth = 1;
    //c.lineWidth = dpr;
    //c.lineWidth = 0.5;
    const data = c.getImageData(0, 0, w, h);
    for (let y = 0; y < h; ++y) {
      for (let x = 0; x < w; ++x) {
        let offset = (x + w * y) * 4;
        if ((x & 1) === 0) {
          continue;
        }
        data.data[offset] = 255;
        data.data[offset+1] = 255;
        data.data[offset+2] = 255;
        data.data[offset+3] = 255;
      }
    }
    c.putImageData(data, 0, 0);

    const bodycol = 'rgb(32, 82, 111)'; // 筐体
    const onshadowcol = 'rgb(67, 158, 176)'; // 点火影

    c.fillStyle = 'rgb(9,46,63)'; // 液晶無点火
    c.fillRect(0, 0, w, h * 0.5);

    c.fillStyle = 'red';
    c.font = `Normal 40px Consolas`;
    c.fillText(`${w} ${h} ${dpr}`, w / 2, h / 2);

    let s = `${'012345678a112345678a212345678a312345678a4'}`;
    const oncol = 'rgb(168, 243, 255)'; // 液晶点火
    c.font = `Bold 80px Sans Serif`;
    c.fillStyle = onshadowcol;
    c.fillText(s, 100 + 4, 100 + 4);
    c.fillStyle = oncol;
    c.fillText(s, 100, 100);
  }

}

const misc = new Misc();
misc.initialize();

