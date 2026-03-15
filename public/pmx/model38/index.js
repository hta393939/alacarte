
import { CharBuilder2 } from "./char2.js";
import { TexMaker } from "./texmaker.js";

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


class Misc {
  constructor() {
    this.STORAGE = 'model';
  }

  getCommonOptions() {
    const param = {
      texprefix: document.getElementById('texprefix')?.value || 'a',
      tail: document.getElementById('tail')?.value || 'e',
      belt: Number.parseFloat(document.getElementById('belt')?.value ?? 1),
      lenhalf: Number.parseFloat(document.getElementById('lenhalf')?.value ?? 1),
      pow2: Number.parseFloat(document.getElementById('pow2element')?.value ?? -3),
//            denom: Number.parseFloat(document.getElementById('denom')?.value ?? 1),
      usephy: document.getElementById('usephyelement')?.checked,
      /**
       * ik 書き出しするかどうか
       */
      useik: document.getElementById('useikelement')?.checked,
      useradius: document.getElementById('useradius')?.checked,
      useradiusq: document.getElementById('useradiusq')?.checked,
      usedynamic: document.getElementById('usedynamic')?.checked,
      usefriction: document.getElementById('usefriction')?.checked,
    };
    param.scale = 2 ** param.pow2;
    param.denom = 1 / param.scale;
    return param;
  }

  saveSetting() {
    console.log('saveSetting called');
    const param = {
      tail: 'e',
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
      tail: 'e',
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

    {
      const el = document.getElementById('selectroot');
      el?.addEventListener('click', async ev => {
        const opt = { mode: 'readwrite' };
        const dh = await window.showDirectoryPicker(opt);
        this.root = dh;

      });
    }

    window.makechar?.addEventListener('click', () => {
      const param = this.getCommonOptions();
      console.log('makechar', param);
  
      Object.assign(param, {
        nameEn: `usagi miku`,
        textures: [
          `chip.png`,
          `sph.png`,
          `marking.png`,
          `body.png`,
          `face.png`,
          `parts1.png`,
          `parts2.png`,
        ],
      });
      this.makeFiles(param, this.dh);

    });

    { // クリップ
      const el = window.idtoclip1;
      el?.addEventListener('click', async () => {
        const maker = new TransObjectBuilder();
        maker.make1();
        const s = maker.toString();
        console.log('transobjectbuilder idtoclip1 s', s);
        await navigator.clipboard.writeText(s);
      });
    }


    { // ドロップ
/** @type {HTMLDivElement} */
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

    for (const k of ['belt', 'lenhalf']) {
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
   * 
   * @param {FileSystemDirectoryHandle} dh 
   * @param {string[]} subs フォルダ
   * @param {string} name
   * @param {Blob} blob 
   */
  async makeFile(dh, subs, name, blob) {
    let handle = dh;
    for (const k of subs) {
      handle = await handle.getDirectoryHandle(k, {create: true});
    }
    const fh = await handle.getFileHandle(name, {create: true});
    const ws = await fh.createWritable();
    await ws.write(blob);
    await ws.close();
    console.log('makeFile');
  }

  /**
   * 
   * @param {HTMLCanvasElement} canvas 
   */
  toBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    });
  }

  /**
   * 一連のファイル群を作成する
   * @param {FileSystemDirectoryHandle} dh 
   */
  async makeFiles(param, dh) {
    console.log('makeFiles');
    /** @type {HTMLCanvasElement[]} */
    const cvs = [];
    for (let i = 0; i < 2; ++i) {
      const side = [2048, 1024][i];
      /** @type {HTMLCanvasElement} */
      const canvas = document.getElementById(`canvast${i}`);
      canvas.width = size;
      canvas.height = size;
      cvs.push(canvas);
    }

    {
      const maker = new TexMaker();
      maker.drawChip(cvs[0], 0, 0);
      maker.drawAdd(cvs[0], 0.5, 0);
      maker.drawMarking(cvs[0], 0, 0.5);
      maker.draw3(cvs[0], 0.5, 0.5);

      maker.drawAdd(cvs[1]);
    }
    for (let i = 0; i < 2; ++i) {
      const blob = await this.toBlob(cvs[i]);
      await this.makeFile(dh,
        ['tex'],
        param.textures[i],
        blob,
      );
    }

    { // .pmx
      const writer = new CharBuilder2();
      writer.make(param);
      const bufs = writer.makeBuffer();

      await this.makeFile(dh,
        [],
        'parametmiku.pmx',
        new Blob(bufs),
      );
    }
    console.log('makeFiles');
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

}

const misc = new Misc();
globalThis.misc = misc;
misc.init();

