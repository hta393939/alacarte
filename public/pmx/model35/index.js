/**
 * @file index.js
 */

const _lim = (a, x, b) => {
  if (x < a) {
    return a;
  }
  if (b < x) {
    return b;
  }
  return x;
};

/**
 * n次元線形補完
 * @param {number[]} a 
 * @param {number[]} b 
 * @param {number} t a側の重み
 * @returns 
 */
const _lerp = (a, b, t, is255) => {
  const num = Math.min(a.length, b.length);
  const ret = [];
  for (let i = 0; i < num; ++i) {
    let val = a[i] * t + b[i] * (1 - t);
    if (is255) {
      val = Math.round(val);
    }
    ret.push(val);
  }
  return ret;
};

const _one255 = v => {
  return Math.max(0, Math.min(255, Math.round(v * 255)));
};

/**
 * @param {number} v 値
 */
const _pad = (v, n = 2) => {
  return String(v).padStart(n, '0');
};

const _dstr = (d = new Date()) => {
  let s = '';
  s += _pad(d.getFullYear(), 4);
  s += `_${_pad(d.getMonth() + 1)}`;
  s += _pad(d.getDate());
  s += `_${_pad(d.getHours())}`;
  s += _pad(d.getMinutes());
  s += _pad(d.getSeconds());
  s += `_${_pad(d.getMilliseconds(), 3)}`;
  return s;
};

/**
 * 距離
 * @param {number[]} a 
 * @param {number[]} b 
 * @returns {number}
 */
const _dist = (a, b) => {
  let sum = 0;
  sum += (a[0] - b[0]) ** 2;
  sum += (a[1] - b[1]) ** 2;
  sum += (a[2] - b[2]) ** 2;
  return Math.sqrt(sum);
};

/**
 * Set から array を得る
 * @param {Set} t 
 * @returns {any[]} 
 */
const _settoarray = (t) => {
  return Array.from(t).sort((a, b) => a - b);
};

const _deg2rad = v => {
  return v * Math.PI / 180;
};

const _rad2deg = v => {
  return v * 180 / Math.PI;
};


class Misc {
  constructor() {
    this.STORAGE = 'model';
  }

/**
 * 
 * @param {File} file 
 */
  async parseFile(file) {
    const ab = await file.arrayBuffer();
    const parser = new PMX.Maker();
    this.parser = parser;
    parser.parse(ab);

    const result = this.analyzeFileRoss(parser);
//        const ss = adjustvts.map(vtx => vtx.toCSV());

    result.push('');
    let str = result.join('\n');
    await navigator.clipboard.writeText(str);
  }

  getCommonOptions() {
    const param = {
      texprefix: document.getElementById('texprefix')?.value || 'a',
      belt: Number.parseFloat(document.getElementById('belt')?.value ?? 1),
      pow2: Number.parseFloat(document.getElementById('pow2element')?.value ?? -3),
//            denom: Number.parseFloat(document.getElementById('denom')?.value ?? 1),
      usephy: document.getElementById('usephyelement')?.checked,
/**
 * ik 書き出しするかどうか
 */
      useik: document.getElementById('useikelement')?.checked,
      useradius: document.getElementById('useradius')?.checked,
      usedynamic: document.getElementById('usedynamic')?.checked,
    };
    param.scale = 2 ** param.pow2;
    param.denom = 1 / param.scale;
    return param;
  }

  saveSetting() {
    console.log('saveSetting called');
    const param = {
      texprefix: 'w',
      belt: 10,
      pow2element: -3,
      useradius: 1,
      usephy: 0,
      usedynamic: 0,
    };
    for (const key in param) {
      const el = document.getElementById(key);
      if (el) {
        if (Number.isFinite(param[key])) {
          param[key] = Number.parseFloat(el.value);
        } else {
          param[key] = el.value;
        }
      }
    }
    const s = JSON.stringify(param);
    window.localStorage.setItem(this.STORAGE, s);
  }

  loadSetting() {
    const s = window.localStorage.getItem(this.STORAGE);
    const param = {
      texprefix: 'w',
      pow2element: -3,
      belt: 10,
    };
    try {
      const obj = JSON.parse(s);
      for (const key in obj) {
        param[key] = obj[key];
      }
    } catch (ec) {
      console.warn('catch', ec.message);
    }
  
    for (const key in param) {
      const el = document.getElementById(key);
      if (el) {
        el.value = param[key];
      }
    }
    console.log('loadSetting', param);
    return param;
  }

  init() {
    this.loadSetting();

    window.view.textContent = new Date().toLocaleTimeString();

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.saveSetting();
      }
    });

    window.idmakehalf?.addEventListener('click', () => {
      const param = this.getCommonOptions();
      const top = 'a';

      Object.assign(param, {
        nameEn: `${top}001_halfcapsule`,
        texturePath: `tex/${top}001.png`,
      });
      const writer = new HalfCapsule();
      writer.make(param);
      const bufs = writer.makeBuffer();
      this.download(new Blob(bufs), `${param.nameEn}_${_dstr()}.pmx`);
      console.log('makehalf offsets');
    });

    window.idmakecentercapsule?.addEventListener('click', () => {
      const param = this.getCommonOptions();
      const top = 'a';
      const d = param.denom;
      let dtext = (d > 1) ? `d${d.toFixed(0)}` : `${(1 / d).toFixed(0)}`;

      Object.assign(param, {
        nameEn: `${top}003_centercapsule_${param.belt}_${dtext}`,
        texturePath: `tex/${top}003.png`,
      });
      const writer = new CenterCapsule();
      writer.make(param);
      const bufs = writer.makeBuffer();
      this.download(new Blob(bufs), `${param.nameEn}_${_dstr()}.pmx`);
      console.log('makecentercapsule offsets');
    });

    window.idmakephycapsule?.addEventListener('click', () => {
      this.makePhyCapsule();
    });

    window.idbon?.addEventListener('click', () => {
      const param = this.getCommonOptions();
      let top = 'a'; // param.texprefix
      Object.assign(param, {
        nameEn: `${top}_bon_${param.belt}_d${param.denom.toFixed(0)}`,
      });
      const writer = new BonMaker();
      writer.make(param);
      const bufs = writer.makeBuffer();
      this.download(new Blob(bufs), `${param.nameEn}.pmx`);
  
      const offsets = writer.toOffsets(bufs);
      for (const chunk of offsets.chunks) {
        chunk.hex = `0x${chunk.offset.toString(16)}`;
      }
      console.log('bon offsets', offsets);
    });

    const makePlanes = (planenum) => {
      const param = {
        planenum,
      };
      Object.assign(param, {
        nameEn: `plane${planenum}`,
      });
      const writer = new CapsuleBuilder();
      writer.makePlane(param);
      const bufs = writer.makeBuffer();
      this.download(new Blob(bufs), `${param.nameEn}.pmx`);
      console.log('make plane', planenum);
    };

    window.idmake1?.addEventListener('click', () => {
      makePlanes(1);
    });
    window.idmake10?.addEventListener('click', () => {
      makePlanes(10);
    });
    window.idmake100?.addEventListener('click', () => {
      makePlanes(100);
    });

    window.idmakelockchain?.addEventListener('click', () => {
      const param = this.getCommonOptions();
      let top = 'a'; // param.texprefix
      const d = param.denom;
      const dtext = (d > 1) ? `d${d.toFixed(0)}` : `${(1 / d).toFixed(0)}`;
      Object.assign(param, {
        nameEn: `${top}013_lockchain_${param.belt}_${dtext}`,
      });
      const writer = new LockChain();
      writer.make(param);
      const bufs = writer.makeBuffer();
      this.download(new Blob(bufs), `${param.nameEn}.pmx`);
      console.log('make lockchain');
    });

    window.idmakeik?.addEventListener('click', () => {
      const param = this.getCommonOptions();
      let top = 'a'; // param.texprefix
      let tail = `d${param.denom.toFixed(0)}`;
      if (param.denom < 1) {
        tail = `${1 / param.denom}`;
      }
      Object.assign(param, {
        nameEn: `${top}007_ikcapsule_${param.belt}_${tail}`,
      });
      const writer = new IKCapsule();
      writer.make(param);
      const bufs = writer.makeBuffer();
      this.download(new Blob(bufs), `${param.nameEn}.pmx`);
  
      const offsets = writer.toOffsets(bufs);
      for (const chunk of offsets.chunks) {
        chunk.hex = `0x${chunk.offset.toString(16)}`;
      }
      console.log('make ikcapsule offsets', offsets);            
    });

    window.idmake8?.addEventListener('click', () => {
      const param = {
        nameEn: `a008_capsulesdef`,
      };
      const writer = new CapsuleBuilder8();
      writer.make(param);
      const bufs = writer.makeBuffer();
      this.download(new Blob(bufs), `${param.nameEn}_${_dstr()}.pmx`);
  
      const offsets = writer.toOffsets(bufs);
      for (const chunk of offsets.chunks) {
        chunk.hex = `0x${chunk.offset.toString(16)}`;
      }
      console.log('make8 offsets', offsets);            
    });

    window.idmake11?.addEventListener('click', () => {
      const param = {
        nameEn: `a011_capsulesdef`,
        scale: 0.25,
        div: 16,
      };
      const writer = new CapsuleBuilder11();
      writer.make(param);
      const bufs = writer.makeBuffer();
      this.download(new Blob(bufs), `${param.nameEn}_${_dstr()}.pmx`);
  
      const offsets = writer.toOffsets(bufs);
      for (const chunk of offsets.chunks) {
        chunk.hex = `0x${chunk.offset.toString(16)}`;
      }
      console.log('make11 offsets', offsets);            
    });

    window.idmakepit?.addEventListener('click', () => {
      this.makePit();
    });

    {
      const el = window.idtoclip1;
      el?.addEventListener('click', async () => {
        const maker = new TransObjectBuilder();
        maker.make1();
        const s = maker.toString();
        console.log('transobjectbuilder idtoclip1 s', s);
        await navigator.clipboard.writeText(s);
      });
    }

    this.draw(window.canvast);
    //this.draw1(window.canvast1);
    //this.draw2(window.canvast2);
    //this.draw3(window.canvast3);

    {
/**
 * @type {HTMLDivElement}
 */
      const el = window.drop;
      el?.addEventListener('dragover', ev => {
        ev.stopPropagation();
        ev.preventDefault();
        ev.dataTransfer.dropEffect = 'copy';
      });
      el?.addEventListener('drop', ev => {
        ev.stopPropagation();
        ev.preventDefault();
        //this.makeApplyClip(ev.dataTransfer.files[0]);
//                this.parseFile(ev.dataTransfer.files[0]);
      });
    }

    for (const k of ['belt', /*'denom'*/]) {
      const el = document.getElementById(k);
      const elview = document.getElementById(`${k}view`);
      const _update = () => {
        elview.textContent = `${el.value}`;
      };
      el?.addEventListener('input', _update);
      _update();
    }
    {
      const el = document.getElementById('pow2element');
      const denomview = document.getElementById('denomview');
      const scaleview = document.getElementById('scaleview');
      const _update = () => {
        const pow2 = Number.parseFloat(el.value);
        denomview.textContent = (1 / (2 ** pow2)).toFixed(6);
        scaleview.textContent = (2 ** pow2).toFixed(6);
      };
      el?.addEventListener('input', _update);
      _update();
    }

  }

  /**
   * ここでは物理カプセルの生成 012
   * phycapsule.js
   */
  makePhyCapsule() {
    document.getElementById('useradius').checked = true;
    document.getElementById('usephyelement').checked = true;

    const param = this.getCommonOptions();

    const writer = new PhyCapsule();
    let top = param.useradius ? 'r' : 'a';
    const d = param.denom;
    const dtext = (d > 1) ? `d${d.toFixed(0)}` : `${(1 / d).toFixed(0)}`;
    Object.assign(param, {
      texturePath: `tex/${top}012.png`,
      nameEn: `${top}012_phycapsule_${param.belt}_${dtext}`,
    });
    writer.make(param);
    const bufs = writer.makeBuffer();
    this.download(new Blob(bufs), `${param.nameEn}.pmx`);
    console.log('makePhyCapsule offsets');
  }

  /**
   * pit.js
   */
  makePit() {
    const param = this.getCommonOptions();

    const writer = new PitMaker();
    const d = param.denom;
    const dtext = (d > 1) ? `d${d.toFixed(0)}` : `${(1 / d).toFixed(0)}`;
    Object.assign(param, {
      nameEn: `a015_pit_${dtext}`,
      //nameEn: `${top}015_pit_${param.belt}_${dtext}`,
    });
    writer.make(param);
    const bufs = writer.makeBuffer();
    this.download(new Blob(bufs), `${param.nameEn}.pmx`);
    console.log('makePit leave');
  }

  /**
   * ダウンロードする
   * @param {Blob} blob 
   * @param {string} name 
   */
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
    const w = 512;
    const h = 512;
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext('2d');
    c.clearRect(0, 0, w, h);
    const img = c.getImageData(0, 0, w, h);
    const center = [w * 0.5, h * 0.5];
    for (let y = 0; y < h; ++y) {
      for (let x = 0; x < w; ++x) {
        let r = 255;
        let g = 255;
        let b = 255;
        let a = 1;
        let lv = 0.5;

        const dx = x - center[0];
        const dy = y - center[1];
        let d = Math.sqrt(dx * dx + dy * dy) / (w / 2);
        const ang = Math.atan2(-dy, dx);
        const deg = ang * 180 / Math.PI;

        if (d < 0.5) {
          lv = 0.5 + 0.25 * (Math.cos(d / 0.5 * Math.PI) + 1) * 0.5;
        } else if (0.5 < d && d < 0.75) {
        } else {
          const p4 = 4 / w;
          d += Math.sin(ang * 17) / 32 + Math.sin(ang * 7) / 16;
          let k = 0.125;
          k = 0.25; // 生成した
          k = 0.5;
          k = 1;
          a = _lim(0, - k * 1 / p4 * (d - 0.875), 1);
        }
        a *= 256;
        lv *= 256;

        r = lv;
        g = lv;
        b = lv;

        const ft = (x + w * y) * 4;
        img.data[ft] = r;
        img.data[ft+1] = g;
        img.data[ft+2] = b;
        img.data[ft+3] = a;
      }
    }
    c.putImageData(img, 0, 0);
  }

  /**
   * 紫系統色
   * @param {HTMLCanvasElement} canvas 
   */
  draw1(canvas) {
    const w = 512;
    const h = 512;
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext('2d');
    const img = c.getImageData(0, 0, w, h);
    for (let y = 0; y < h; ++y) {
      for (let x = 0; x < w; ++x) {
        let hang = Math.PI * 2 * x / w;
        let rateh = 10;
        let k = Math.sin(hang * rateh);
        let r = 128 * ((k + 1) * 0.25 + 0.5);
        let g = 0;
        let b = 255 * ((k + 1) * 0.25 + 0.5);
        let a = 255;

        let ft = (x + w * y) * 4;
        let nx = x / (w - 1) * 2 - 1;
        let ny = y / (h - 1) * 2 - 1;
        if (y < h / 4 || y >= 3 * h / 4) { // 外側
          let ang = Math.PI;
          let hang = Math.PI * 2 * x / w;
          let k2 = (Math.abs(ny) - 0.5) * 2;
          r = 128 * k2 + r * (1 - k2);
          g =   0 * k2 + g * (1 - k2);
          b = 255 * k2 + b * (1 - k2);
        } else { // 内側
          let ang = Math.PI;
        }

        img.data[ft] = r;
        img.data[ft+1] = g;
        img.data[ft+2] = b;
        img.data[ft+3] = a;
      }
    }
    c.putImageData(img, 0, 0);
  }

  /**
   * sha マップ生成
   * @param {HTMLCanvasElement} canvas 
   */
  draw2(canvas) {
    console.log('draw2 called');
    const w = 512;
    const h = 512;
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext('2d');
    c.fillStyle = 'rgb(0, 0, 0)';
    c.fillRect(0, 0, w, h);
    const img = c.getImageData(0, 0, w, h);
    for (let y = 0; y < h; ++y) {
      for (let x = 0; x < w; ++x) {
        let r = 0;
        let g = 0;
        let b = 0;
        let a = 255;

        let ft = (x + w * y) * 4;
        let nx = x / (w - 1) * 2 - 1;
        let ny = y / (h - 1) * 2 - 1;
        let rr = Math.sqrt(nx * nx + ny * ny);

        if (rr <= 1.1) { // 外側
          let lv = 0;
          const ellipses = [
{ cx: 0.1, cy: -0.1, deg: 45, top: 0.5, k: 4, bx: 1, by: 1.2 },
//{ cx: -0.5, cy: 0.5, deg: -45, top: 1/8, k: 2, bx: 1.5, by: 1.5 },
          ];
          for (const ellipse of ellipses) {
            const ang = ellipse.deg * Math.PI / 180;
            const cs = Math.cos(ang);
            const sn = Math.sin(ang);
            let cx = ellipse.cx;
            let cy = ellipse.cy;

            let mx = (nx - cx);
            let my = (ny - cy);
            let dx = mx * cs - my * sn;
            let dy = mx * sn + my * cs;
            dx /= (ellipse.bx || 1);
            dy /= (ellipse.by || 1);

            rr = Math.sqrt(dx * dx + dy * dy);

            let add = ellipse.top - rr * ellipse.k;
            lv += Math.max(0, add);
          }
          {

          }

          lv = Math.max(0, Math.min(255, Math.round(lv * 255)));
          r = lv;
          g = lv;
          b = lv;
        } else {
          r = 128;
          g = 128;
          b = 128;
        }

        img.data[ft] = r;
        img.data[ft+1] = g;
        img.data[ft+2] = b;
        img.data[ft+3] = a;
      }
    }
    c.putImageData(img, 0, 0);
  }

  /**
   * 壁
   * @param {HTMLCanvasElement} canvas 
   */ 
  draw3(canvas) {
    console.log('draw3 called');
    const util = new Util();
    util.srand(1);
    const baseColor = [153, 17, 255];
    const padding = 8;
    const padColor = baseColor.map(c => c * 0.5);
//        const padColor = [0, 0, 0]; // 黒

    const ellipses = [
//{ cx: 1/16, cy: -0.75, deg: 20, top: 1, k: 8, bx: 0.5, by: 0.6, add: true },

{ cx: -3/8, cy: -0.75, deg: -1, top: 1, k: 8, bx: 0.5, by: 8, add: true },
{ cx: 1/8, cy: 0.75, deg: -1, top: 1, k: 8, bx: 0.5, by: 8, add: true },
    ];
    for (let k = 0; k <= 8; ++k) {
      const obj = {
        cx: k / 4 - 1,
        cy: util.rand() / 32768 - 0.5,
        deg: (util.rand() / 32768 - 0.5) * 15,
        top: 1,
        k: 4,
        bx: 0.5 + (util.rand() / 32768 - 0.5) * 0.1,
        by: 6 + (util.rand() / 32768 - 0.5) * 2,
        add: true,
      };
      ellipses.push(obj);
      //console.log(obj);
    }


    const w = 512;
    const h = 512;
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext('2d');
    c.fillStyle = 'rgb(0, 0, 0)';
    c.fillRect(0, 0, w, h);
    const img = c.getImageData(0, 0, w, h);
    for (let y = 0; y < h; ++y) {
      for (let x = 0; x < w; ++x) {
        let r = 0;
        let g = 0;
        let b = 0;
        let a = 255;

        let ft = (x + w * y) * 4;
        let nx = x / (w - 1) * 2 - 1;
        let ny = y / (h - 1) * 2 - 1;
        let rr = Math.sqrt(nx * nx + ny * ny);

        {
          let lv = 0.5;

          for (const ellipse of ellipses) {
            const ang = ellipse.deg * Math.PI / 180;
            const cs = Math.cos(ang);
            const sn = Math.sin(ang);
            let cx = ellipse.cx;
            let cy = ellipse.cy;

            let mx = (nx - cx);
            let my = (ny - cy);
            let dx = mx * cs - my * sn;
            let dy = mx * sn + my * cs;
            dx /= (ellipse.bx || 1);
            dy /= (ellipse.by || 1);

            rr = Math.sqrt(dx * dx + dy * dy);

            let add = ellipse.top - rr * ellipse.k;
            if (ellipse.add) {
              lv += Math.max(0, add);
            } else {
              lv -= Math.max(0, add);
            }
          }

          r = _one255(lv * 153 / 255);
          g = _one255(lv * 17 / 255);
          b = _one255(lv);

          {
            let mx = padding - x;
            let my = padding - y;
            mx = Math.max(mx, x - (w - padding));
            my = Math.max(my, y - (h - padding));
            mx = Math.max(0, mx);
            my = Math.max(0, my);
            const t = Math.min(1, Math.sqrt(mx * mx + my * my) / padding);
            const col = _lerp(padColor, [r, g, b], t, true);
            
            r = col[0];
            g = col[1];
            b = col[2];
          }
        }

        img.data[ft] = r;
        img.data[ft+1] = g;
        img.data[ft+2] = b;
        img.data[ft+3] = a;
      }
    }
    c.putImageData(img, 0, 0);
  }

}

const misc = new Misc();
misc.init();


