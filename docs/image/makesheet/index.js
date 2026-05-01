
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
          let r = (j / w) * 256;
          let g = 0;
          let b = (i / h) * 256;
          if (xy) {
            g = ((h - 1 - i) / h) * 256;
            b = 0;
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
    const text = await file.text();
    const lines = text.split('\n');
    const result = {
      objs: []
    };
    for (const line of lines) {
      const vals = line.split(',').map(val => Number.parseFloat(val));
      if (!Number.isFinite(vals[0])) {
        continue;
      }

      const obj = {
        index: vals[0],
        id: vals[1],
        x: vals[2],
        y: vals[3],
        a: vals[4],
        rx: vals[5],
        ry: vals[6],
      };
      result.objs.push(obj);
    }
    console.log('result', result);

    this.draw(window.canvas, result.objs);

    return result;
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
        this.analyzeText(ev.dataTransfer.files[0]);
      });
    }
    {
      const el = document.getElementById('enumvoice');
      el?.addEventListener('click', () => {
        this.enumVoice();
      });
    }

    {
      const el = document.getElementById('saytext');
      el?.addEventListener('click', () => {
        this.speakerid = Number.parseInt(window.speakerid.value);
        //this.say('こんにちなのだ', true);
        this.say(window.text.value, true);
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

  /**
   * 
   * @param {HTMLCanvasElement} canvas 
   */
  drawCap(canvas, /*objs*/) {
    console.log('drawCap called');
    const c = canvas.getContext('2d');

    const w = 512;
    const h = 512;
    //const w = 64;
    //const h = 64;
    const rate = 512 / 64;
// 1: (1/PI) のとき
    //const offsetY = h * 0.5 - 512 / Math.PI * 0.5;

// 1: (2/PI) のとき
    const offsetY = h * 0.5 - 512 / Math.PI;

    canvas.width = w;
    canvas.height = h;
    //c.fillStyle = 'rgba(51, 153, 51, 1)';
    c.fillStyle = 'rgba(51, 176, 51, 1)';
    c.fillRect(0, 0, w, h);

    {
      const img = document.getElementById('baseimage');
      if (img.naturalWidth > 0) {
        c.drawImage(img, 0, 0);
      }
    }

    let c0 = [0, 153, 0];
    let c1 = [51, 255, 51];

    const objs = [
//            { x: 0, y: 1, z: 0, top: 1, radius: 0.2 },
    ];
    for (let i = 0; i < 8; ++i) {
      if (i === 4 || i === 6) {
        continue;
      }
      const longi = (i * 2 + 1) / 16 * Math.PI * 2;
      const lati = (0.8 + 0.2 * (Math.random() - 0.5)) * Math.PI * 0.5;
      const rr = Math.cos(lati);
      const obj = {
        x: - rr * Math.sin(longi),
        y: Math.sin(lati),
        z: rr * Math.cos(longi),
        radius: 0.1 + Math.random() * 0.01,
      };
      objs.push(obj);
    }
    for (let i = 0; i < 10; ++i) {
      if (i === 0 || i === 4) {
        continue;
      }
      const longi = (i * 2 + 1) / 20 * Math.PI * 2;
      const lati = (0.74 + 0.02 * Math.random() * Math.PI * 0.5);
      const rr = Math.cos(lati);
      const obj = {
        x: - rr * Math.sin(longi),
        y: Math.sin(lati),
        z: rr * Math.cos(longi),
        radius: 0.2 + Math.random() * 0.01,
      };
      objs.push(obj);
    }
    for (let i = 0; i < 9; ++i) {
      const longi = (i * 2 + 1 + 0.2) / 18 * Math.PI * 2;
      const lati = (0.2 + 0.05 * (Math.random() - 0.5)) * Math.PI * 0.5;
      const rr = Math.cos(lati);
      const obj = {
        x: - rr * Math.sin(longi),
        y: Math.sin(lati),
        z: rr * Math.cos(longi),
        radius: 0.18 + Math.random() * 0.03,
      };
      objs.push(obj);
    }

    const img = c.getImageData(0, 0, w, h);
    //const capV = 0.25;
    const capV = 92 / 512;
    for (let y = 0; y < h; ++y) {
      for (let x = 0; x < w; ++x) {
        const nx = x / w;
        const ny = y / h;
        if (ny > capV) {
          continue;
        }
        const longi = nx * Math.PI * 2;
        const lati = (capV - ny) / capV * Math.PI * 0.5;
        const rr = Math.cos(lati);
        const sph = [
          -Math.sin(longi) * rr,
          Math.sin(lati),
          Math.cos(longi) * rr
        ];
        let r = 51;
        let g = 176;
        let b = 51;
        let a = 255;
        let lv = 0;


        for (const obj of objs) {
          const dist = Math.sqrt(
            (obj.x - sph[0]) ** 2
            + (obj.y - sph[1]) ** 2
            + (obj.z - sph[2]) ** 2
          );
          const diff = 1 - dist / obj.radius;
          if (diff > 1 || diff <= 0) {
            continue;
          }
          
          const col = _lerp(c0,
            c1,
            Math.min(1, Math.max(0, diff)),
            true);
          r = col[0];
          g = col[1];
          b = col[2];
        }
        let ft = (x + w * y) * 4;

        img.data[ft] = r;
        img.data[ft+1] = g;
        img.data[ft+2] = b;
        img.data[ft+3] = a;

        ft = (x + w * (h - 1 - y)) * 4;
        img.data[ft] = r;
        img.data[ft+1] = g;
        img.data[ft+2] = b;
        img.data[ft+3] = a;
      }
    }
    c.putImageData(img, 0, 0);
    console.log('drawCap leave');
  }

}

const misc = new Misc();
globalThis.misc = misc;
misc.initialize();
