
/**
 * 
 * @param {number} r 
 * @param {*} g 
 * @param {*} b 
 * @param {number} [k=255] 倍数。デフォルト 255
 * @returns 
 */
const _rgbstr = (r, g, b, k = 255) => {
  const cols = [r, g, b];
  return `rgb(${cols.map(v => Math.max(0,
    Math.min(255, Math.floor(v * k)))).join(',')})`;
};

  /**
   * 
   * @param {*} a 
   * @param {*} b 
   * @param {number} t b側の重み
   * @param {*} is255 
   * @returns 
   */
const _lerp = (a, b, t, is255) => {
  const num = Math.min(a.length, b.length);
  const ret = new Array(num);
  for (let i = 0; i < num; ++i) {
    ret[i] = a[i] * (1 - t) + b[i] * t;
    if (is255) {
      ret[i] = Math.round(ret[i]);
    }
  }
  return ret;
};

class Misc {
  constructor() {
  }

  async initialize() {
    this.setListener();

    this.drawGradRB(window.maincanvas, true);
    this.drawGradRB(window.subcanvas, false);
  }

  download(blob, name) {
    const a = document.createElement('a');
    a.download = name;
    a.href = URL.createObjectURL(blob);
    a.click();
  }

  /**
   * 
   * @param {HTMLCanvasElement} canvas 
   */
  draw(canvas) {
    const one = 256;
    const w = one * 4;
    const h = one * 4;

    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext('2d');
    c.fillStyle = 'rgba(51, 153, 51, 1)';
    c.fillStyle = 'rgba(128, 128, 128, 1)';
    c.fillRect(0, 0, w, h);

    const dirs = [
      { // Y-
        col: (j, i) => {
        return [i,0,j];
      },
        pos: (j, i) => {
          return [one * 3 / 2 + j, i];
        }
      },
      { // Z-
        col: (j, i) => {
        return [j,i,0];
      },
        pos: (j, i) => {
          return [one * 1 / 2 + j, i + one];
        }
      },
      { // X+
        col: (j, i) => {
        return [255,i,j];
      },
        pos: (j, i) => {
          return [one * 3 / 2 + j, i + one];
        }},
      { // Z+
        col: (j, i) => {
        return [255-j,i,255];
      },
        pos: (j, i) => {
          return [one * 5 / 2 + j, i + one];
        }},
      { // Y+
        col: (j, i) => {
        return [255-i,255,j];
      },
        pos: (j, i) => {
          return [one * 3 / 2 + j, i + one * 2];
        }},
      { // X-
        col: (j, i) => {
        return [0,255-i,j];
      },
        pos: (j, i) => {
          return [one * 3 / 2 + j, i + one * 3];
        }
      },
    ];
    const img = c.getImageData(0, 0, w, h);
    for (const dir of dirs) {

      for (let i = 0; i < one; ++i) {
        for (let j = 0; j < one; ++j) {
          const col = dir.col?.(j, i) || [0, 0, 0];
          const pos = dir.pos?.(j, i) || [0, 0];
          let offset = (pos[0] + w * pos[1]) * 4;
          img.data[offset] = col[0];
          img.data[offset+1] = col[1];
          img.data[offset+2] = col[2];
          img.data[offset+3] = 255;
        }
      }

    }
    c.putImageData(img, 0, 0);

    if (true) {
      c.font = `normal 200px Segoe UI Emoji`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = 'rgb(255,128,0)';

      c.translate(one * 6 / 2, one * 3 / 2);
      //c.rotate(Math.PI * 0.5);
      //c.fillText(`z`, one * 3 / 2, one * 4);
      //c.fillText(`a`, one * 3 / 2, one * 1);
      c.fillText(`\u{1f99c}`, 0 + 8, 0 + 12);
      //c.fillText(`c`, one * 3 / 2, one * 3);
      c.resetTransform();
    }

    {
      const rr = 8;
      const ringRate = 16;
      const pats = [
        {x: one * 1 - one * 0.25, y: one * 3 / 2 - one * 0.25},
        {x: one * 1 + one * 0.25, y: one * 3 / 2 - one * 0.25},
        {x: one * 1 - one * 0.25, y: one * 3 / 2 + one * 0.25},
        {x: one * 1 + one * 0.25, y: one * 3 / 2 + one * 0.25},
      ];
      const rings = [
        {num: 1, rr: 0, f: idx => 14}, // 常に明るい
        {num: 4, rr: 1, f: idx => 14},
        {num: 8, rr: 2, f: idx => {
          return (idx <= 1) ? 1 : 11;
        }},
        {num: 16, rr: 3, f: idx => {
          return (idx <= 1) ? 1 : 11;
        }}
      ];

      for (let m = 0; m < pats.length; ++m) {
        const pat = pats[m];
        switch (m) {
        case 1:
          rings[2].f = idx => {
            return [1,1,5,5, 12,12,12,12][idx];
          };
          rings[3].f = idx => {
            return [1,5,12,12][Math.floor(idx / 4)];
          };
          break;
        case 2:
          rings[2].f = idx => {
            return [1,1,12,12, 1,1,12,12][idx];
          };
          rings[3].f = idx => {
            return [1,12,1,12][Math.floor(idx / 4)];
          };
          break;
        case 3:
          rings[2].f = idx => {
            return [1, 12, 1, 12, 1, 12, 1, 12][idx];
          }
          rings[3].f = idx => {
            return [1,1,12,12][Math.floor(idx % 4)];
          };
          break;
        }

        for (const ring of rings) {
          for (let i = 0; i < ring.num; ++i) {
            let ang = Math.PI * 2 * (i * 2 + 1) / (ring.num * 2);
            if (ring.num === 8) {
              ang = Math.PI * 2 * i / ring.num;
            }
            const cs = Math.cos(ang);
            const sn = Math.sin(ang);
            let x = pat.x + cs * ring.rr * ringRate;
            let y = pat.y + sn * ring.rr * ringRate;
            let lv = ring.f(i);
            c.fillStyle = _rgbstr(lv * 17, lv * 17, lv * 17, 1);
            c.beginPath();
            c.ellipse(x, y, rr, rr, 0, 0, Math.PI * 2);
            c.fill();
          }
        }

      }
    }

    console.log('draw end');
    return;
  }

  /**
   * 
   * @param {HTMLCanvasElement} canvas 
   */
  drawGradRB(canvas, xy) {
    const w = 1024;
    const h = 1024;

    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext('2d');
    c.fillStyle = 'rgba(51, 153, 51, 1)';
    c.fillStyle = 'rgba(128, 128, 128, 1)';
    //c.fillRect(0, 0, w, h);

    const img = c.getImageData(0, 0, w, h);
      for (let i = 0; i < h; ++i) {
        for (let j = 0; j < w; ++j) {
          let nx = j / w;
          let ny = i / h;
          let r = (j / w) * 256;
          let g = 0;
          let b = (i / h) * 256;
          if (false) {
            g = ((h - 1 - i) / h) * 256;
            b = 0;
          } else if (false) {
            r = 0;
            g = ((h - 1 - i) / h) * 256;
            b = ((w - 1 - j) / w) * 256;
          } else {
            r = nx * 256;
            g = (1 - ny) * 256;
            b = (1 - nx) * 256;
          }

          let offset = (j + w * i) * 4;
          img.data[offset] = r;
          img.data[offset+1] = g;
          img.data[offset+2] = b;
          img.data[offset+3] = 255;
        }
    }
    c.putImageData(img, 0, 0);
    console.log('draw end');
    return;
  }

  /**
   * 
   * @param {File} file 
   * @returns 
   */
  async fromImage(file) {
    const ab = await file.arrayBuffer();

    const bmp = await window.createImageBitmap(file);
    const w = bmp.width;
    const h = bmp.height;
    /** @type {HTMLCanvasElement} */
    const canvas = document.getElementById('canvas');
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext('2d');
    c.drawImage(bmp, 0, 0);
    return;
  }

  async copyImage() {
    const bmp = document.getElementById('allcircle');
    const w = bmp.naturalWidth;
    const h = bmp.naturalHeight;
    /** @type {HTMLCanvasElement} */
    const canvas = document.getElementById('canvas');
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext('2d');
    c.drawImage(bmp, 0, 0);
    return;
  }

  /**
   * 
   * @param {Object[]} colorRoutes
   * @param {HTMLCanvasElement} canvas 
   */
  makeCanvas(colorRoutes) {
    const canvas = document.createElement('canvas');
    canvas.id = 'makecanvas';
    canvas.width = 11 * 10;
    canvas.height = 11 * 10;
    const c = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    c.lineWidth = 2;

    c.strokeStyle = `#ff0000`;
    for (const colorRoute of colorRoutes) {
      c.fillStyle = `#${colorRoute.dot.col.toString(16).padStart(6, '0')}`;
      c.beginPath();
      for (const route of colorRoute.routes) {
        const n = route.pts.length;
        if (n <= 1) {
          continue;
        }
        let index = 1;

        c.moveTo(route.pts[0][0] * 10, route.pts[0][1] * 10);
        for (let i = 1; i < n; ++i) {
          const pt = route.pts[i];
          c.lineTo(pt[0] * 10, pt[1] * 10);
        }
        if (route.pts[0][0] === route.pts[n-1][0] && route.pts[0][1] === route.pts[n-1][1]) {
          c.closePath();
        }

      }
      c.fill();
      c.stroke();
    }

    console.log('makeCanvas');
    return canvas;
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
        this.fromImage(ev.dataTransfer.files[0]);
      });
    }

    {
      const el = document.getElementById('openwindow');
      el?.addEventListener('click', () => {
        this.openWindow();
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

  }

}

const misc = new Misc();
globalThis.misc = misc;
misc.initialize();
