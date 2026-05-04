
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
    this.name = 'foo';
  }

  /**
   * 
   * @param {File} file 
   */
  async loadToSrc(file) {
    {
      const re = /(?<base>.+)\.(?<ext>[^\.]+)/;
      const m = re.exec(file.name);
      this.name = m ? m.groups['base'] : file.name;
      document.title = `${this.name} - dot to svg`;
    }

    const bmp = await window.createImageBitmap(file);
    /** @type {HTMLCanvasElement} */
    const canvas = document.getElementById('srccanvas');
    canvas.width = bmp.width;
    canvas.height = bmp.height;
    const c = canvas.getContext('2d');
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.drawImage(bmp, 0, 0);
    return canvas;
  }

  async initialize() {
    this.setListener();

    {
      await this.copyImage();

      this.actProcess();
    }
  }

  download(blob, name) {
    const a = document.createElement('a');
    a.download = name;
    a.href = URL.createObjectURL(blob);
    a.click();
  }

  async retryAll() {
    for (let i = 0; i < 38; ++i) {
      let mx = i % 6;
      let my = Math.floor(i / 6);
      window.offsetx.value = mx * 10;
      window.offsety.value = my * 10;
      await this.actProcess();
    }
  }

  /**
   *
   */
  async actProcess() {
    const param = this.gatherCommonParam();
    console.log('actProcess', param);

    const srccanvas = document.getElementById('srccanvas');
    if (!param.limitarea) { // 全体を使用する
      param.offsetx = 0;
      param.offsety = 0;
      param.pwidth = srccanvas.width;
      param.pheight = srccanvas.height;
    }
    const isDownload = param.isdownload;
    {
      /** @type {HTMLCanvasElement} */
      const canvas = document.getElementById('canvas');
      canvas.width = param.pwidth;
      canvas.height = param.pheight;
      const c = canvas.getContext('2d');
      c.clearRect(0, 0, canvas.width, canvas.height);
      c.drawImage(srccanvas, param.offsetx, param.offsety);

      const contour = new Contour();
      contour.init(canvas);
      param.cwidth = contour.width;
      param.cheight = contour.height;
      const routes = contour.search();
      console.log('routes', routes);
      const colorRoutes = contour.gatherByColor(routes);
      const drawedCanvas = this.makeCanvas(colorRoutes, param);
      document.body.appendChild(drawedCanvas);

      const text = this.makeSVG(colorRoutes, param);
      if (isDownload) {
        this.download(new Blob([text]), `${this.name}.svg`);
      }
    }
  }

  async copyImage() {
    const bmp = document.getElementById('allcircle');
    const w = bmp.naturalWidth;
    const h = bmp.naturalHeight;
    /** @type {HTMLCanvasElement} */
    const canvas = document.getElementById('srccanvas');
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext('2d');
    c.drawImage(bmp, 0, 0);
    return;
  }

  /**
   * 
   * @param {Object[]} colorRoutes
   */
  makeCanvas(colorRoutes, param) {
    const rate = param.rate || 10;

    const canvas = document.createElement('canvas');
    canvas.width = param.cwidth * rate;
    canvas.height = param.cheight * rate;
    const c = canvas.getContext('2d');
    c.fillStyle = '#008080';
    c.fillRect(0, 0, canvas.width, canvas.height);
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
        c.moveTo(route.pts[0][0] * rate, route.pts[0][1] * rate);
        for (let i = 1; i < n; ++i) {
          const pt = route.pts[i];
          c.lineTo(pt[0] * rate, pt[1] * rate);
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
   * @param {object} param
   * @param {number} [param.rate=10] 1ドット量
   */
  makeSVG(colorRoutes, param) {
    const rate = param.rate || 10;

    const el = document.createElement('svg');
    {
      el.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      el.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
      if (!param.iscustom) {
        // NOTE: B は大文字だが残ってくれない
        el.setAttribute('viewBox', `${1 * rate} ${1 * rate} ${param.pwidth * rate} ${param.pheight * rate}`);
      } else {
        el.setAttribute('viewBox', `${0 * rate} ${0 * rate} ${(param.pwidth + 2) * rate} ${(param.pheight + 2) * rate}`);
      }
    }

    {
      const defs = document.createElement('defs');
      const viewg = document.createElement('g');
      if (param.iscustom) {
        const circle = document.createElement('circle');
        circle.setAttribute('cx', 55);
        circle.setAttribute('cy', 55);
        circle.setAttribute('r', 50);
        circle.setAttribute('fill', 'none');
        circle.setAttribute('stroke', '#808080');
        circle.setAttribute('stroke-width', 0.125);
        viewg.appendChild(circle);
      }

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
              ss.push('M', route.pts[0][0] * rate, route.pts[0][1] * rate, 'L');
              let index = 1;
              for (let i = 1; i < n; ++i) {
                if (i === n - 1) {
                  if (route.pts[0][0] === route.pts[i][0] && route.pts[0][1] === route.pts[i][1]) {
                    ss.push('z');
                    break;
                  }
                }
                ss.push(route.pts[i][0] * rate, route.pts[i][1] * rate);
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
      {src: '></circle>', dst: ' />'},
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
    for (const k of ['limitarea', 'isdownload', 'iscustom']) {
      const el = document.getElementById(k);
      param[k] = el?.checked;
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
      el?.addEventListener('drop', async ev => {
        ev.stopPropagation();
        ev.preventDefault();
        await this.loadToSrc(ev.dataTransfer.files[0]);
        this.actProcess();
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

    {
      const el = document.getElementById('retry');
      el?.addEventListener('click', () => {
        this.actProcess();
      });
    }
    {
      const el = document.getElementById('retryall');
      el?.addEventListener('click', () => {
        this.retryAll();
      });
    }

  }

}

const misc = new Misc();
globalThis.misc = misc;
misc.initialize();
