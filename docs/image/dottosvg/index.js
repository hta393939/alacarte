
import {Contour} from "./contour.js";

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

    {
      await this.copyImage();
      {
        const cv0 = window.canvas;
        /** @type {HTMLCanvasElement} */
        const cv1 = document.createElement('canvas');
        cv1.id = 'onewmargin';
        cv1.width = 11;
        cv1.height = 11;
        const c = cv1.getContext('2d');
        c.drawImage(cv0, 1, 1);
        document.body.appendChild(cv1);
      }

      const contour = new Contour();
      contour.init(window.onewmargin);
      const routes = contour.search();
      console.log('routes', routes);
      const colorRoutes = contour.gatherByColor(routes);
      const canvas = this.makeCanvas(colorRoutes);
      document.body.appendChild(canvas);

      const text = this.makeSVG(colorRoutes);
      //this.download(new Blob([text]), `foo.svg`);
    }
  }

  download(blob, name) {
    const a = document.createElement('a');
    a.download = name;
    a.href = URL.createObjectURL(blob);
    a.click();
  }

  /**
   * 
   * @param {File} file 
   */
  async actProcess(file, param) {
    {
      const bmp = await window.createImageBitmap(file);
      const iw = bmp.width;
      const ih = bmp.height;
      /** @type {HTMLCanvasElement} */
      const canvas = document.getElementById('canvas');
      canvas.width = iw + 2;
      canvas.height = ih + 2;
      const c = canvas.getContext('2d');
      c.drawImage(bmp, 1, 1);

      const contour = new Contour();
      contour.init(canvas);
      const routes = contour.search();
      console.log('routes', routes);
      const colorRoutes = contour.gatherByColor(routes);
      const drawedCanvas = this.makeCanvas(colorRoutes);
      document.body.appendChild(drawedCanvas);

      const text = this.makeSVG(colorRoutes);
      this.download(new Blob([text]), `foo.svg`);
    }
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

  /**
   * 
   * @param {object[]} colorRoutes 
   */
  makeSVG(colorRoutes) {
    const el = document.createElement('svg');
    {
      el.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      el.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
      // NOTE: B は大文字だが残ってくれない
      el.setAttribute('viewBox', '20 20 90 90');
    }

    {
      const defs = document.createElement('defs');
      const viewg = document.createElement('g');
      {
        let count = 0;
        for (const colorRoute of colorRoutes) {
          const id = `id${count}`;

          const g = document.createElement('g');
          g.setAttribute('id', id);
          g.setAttribute('fill', `#${colorRoute.dot.col.toString(16).padStart(6, '0')}`);

          const pathel = document.createElement('path');

          {
            let ss = [];
            for (const route of colorRoute.routes) {
              const n = route.pts.length;
              if (n < 2) {
                continue;
              }
              ss.push('M', route.pts[0][0] * 10, route.pts[0][1] * 10, 'L');
              let index = 1;
              for (let i = 1; i < n; ++i) {
                if (i === n - 1) {
                  if (route.pts[0][0] === route.pts[i][0] && route.pts[0][1] === route.pts[i][1]) {
                    ss.push('z');
                    break;
                  }
                }
                ss.push(route.pts[i][0] * 10, route.pts[i][1] * 10);
              }
            }
            pathel.setAttribute('d', ss.join(' '));
          }

          g.appendChild(pathel);
          defs.appendChild(g);

          {
            const use = document.createElement('use');
            use.setAttribute('xlink:href', `#${id}`);
            viewg.appendChild(use);
          }

          count += 1;
        }
      }
      el.appendChild(defs);

      el.appendChild(viewg);
    }

    let text = el.outerHTML;

    for (const v of [
      {src: 'viewbox', dst: 'viewBox'},
      {src: '></use>', dst: ' />'},
      {src: '></path>', dst: ' />'},
      {src: '>', dst: '>\n'}
    ]) {
      text = text.replaceAll(v.src, v.dst);
    }

    console.log('makeSVG', text);
    return text;
  }

  gatherCommonParam() {
    const param = {};
    for (const k of ['offsetx', 'offsety', 'pwidth', 'pheight']) {
      const el = document.getElementById(`${k}`);
      if (el) {
        let val = Number.parseFloat(el.value);
        if (Number.isFinite(val)) {
          param[k] = val;
        }
      }
    }
    return param;
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
        this.actProcess(ev.dataTransfer.files[0]);
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

  }

}

const misc = new Misc();
globalThis.misc = misc;
misc.initialize();
