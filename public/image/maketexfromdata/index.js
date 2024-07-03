/**
 * @file index.js
 */

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

    this.drawCap(window.maincanvas);
  }

/**
 * 
 * @param {HTMLCanvasElement} canvas 
 */
  draw(canvas, objs) {
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
    const c = canvas.getContext('2d');
    c.fillStyle = 'rgba(51, 153, 51, 1)';
    c.fillStyle = 'rgba(51, 176, 51, 1)';
    c.fillRect(0, 0, w, h);

    const _l = (a, b, index, t) => {
      return a[index] * (1 - t) + b[index] * t;
    };

    for (const obj of objs) {
      let c0 = [0, 153, 0];
      let c1 = [51, 255, 51];
      let smaller = 1;
      for (let i = 0; i <= 16 - smaller; ++i) {
        let t = i / 16;
        let k = (16 - smaller) /16 - t;
        c.beginPath();
        c.strokeStyle = 'red';
        c.fillStyle = `rgb(${_l(c0, c1, 0, t)}, ${_l(c0, c1, 1, t)}, ${(c0, c1, 2, t)}, 0.5)`;
        c.ellipse(obj.x * rate,
          obj.y * rate + offsetY,
          obj.rx * rate * k, obj.ry * rate * k,
          obj.a,
          0, Math.PI * 2);
        c.fill();
        //c.stroke();
      }

//            c.fillStyle = 'blue';
//            c.fillRect(obj.x, obj.y, 4, 4);
    }
    return;
  }

  async analyzeText(file) {
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
misc.initialize();



