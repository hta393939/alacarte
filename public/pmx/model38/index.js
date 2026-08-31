
import "./util.js";
import { CharBuilder } from "./charbuilder.js";
import { TexMaker } from "./texmaker.js";

/**
 * 髪1 [0,1,1]
 * 髪2 [0,1,0]
 * 服灰 [1,1,1]
 * 服黒 [0,0,0]
 * アクセント紫 [1,0,1]
 * アクセント黒 [0,0,0]
 */
class Misc {
  constructor() {
    this.STORAGE = 'model';
  }

/**
 * @param {number} v 値
 */
//const _pad = (v, n = 2) => {
//  return String(v).padStart(n, '0');
//};
/*
  dstr(d = new Date()) {
    let s = '';
    s += _pad(d.getFullYear(), 4);
    s += `_${_pad(d.getMonth() + 1)}`;
    s += _pad(d.getDate());
    s += `_${_pad(d.getHours())}`;
    s += _pad(d.getMinutes());
    s += _pad(d.getSeconds());
    s += `_${_pad(d.getMilliseconds(), 3)}`;
    return s;
  } */

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
       * グレースケール化しない
       */
      usecolor: document.getElementById('usecolor')?.checked,
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
        this.dh = dh;
      });
    }


    const _makeChar = (isWrite) => {
      const param = this.getCommonOptions();
      console.log('_makechar', isWrite, param);

      let commentJa = `https://piapro.jp/license/pcl/summary\r\n${new Date().toLocaleString()}\r\n${CharBuilder.VERSION}\r\n`;
      commentJa += `ボーン構造など ニコニ立体 アリシア・ソリッド モデルを参考にしています。\r\n`;

      Object.assign(param, {
        nameJa: `ウサギ式初音ミク ロボアバタースタイル`,
        nameEn: `Usagi's Hatsune Miku - robo avatar style`,
        commentJa,
        commentEn: `https://piapro.jp/license/pcl/summary`,
        textures: [
          `tex.png`,
          `sph.png`,
        ],
      });
      this.makeFiles(param, this.dh, isWrite);
    };

    window.makechar?.addEventListener('click', () => {
      _makeChar(true);
    });
    window.drychar?.addEventListener('click', () => {
      _makeChar(false);
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
   * FileSystemファイル書き出し
   * @param {FileSystemDirectoryHandle} dh 
   * @param {string[]} subs サブフォルダに潜る場合
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
   * @param {boolean} isWrite ファイル書き出しするかしないか
   */
  async makeFiles(param, dh, isWrite) {
    console.log('makeFiles start', isWrite);
    /** @type {HTMLCanvasElement[]} */
    const cvs = [];
    for (let i = 0; i < 2; ++i) {
      const size = [2048, 1024][i];
      /** @type {HTMLCanvasElement} */
      const canvas = document.getElementById(`canvast${i}`);
      canvas.width = size;
      canvas.height = size;
      cvs.push(canvas);
    }

    {
      const maker = new TexMaker();
      if (false) { // TODO: スフィアマップ有効時
        maker.drawAdd(cvs[1]);
      } else {
        const c = cvs[1].getContext('2d');
        c.fillStyle = 'black';
        c.fillRect(0, 0, c.canvas.width, c.canvas.height);
      }

      maker.drawChip(cvs[0], 0, 0);
      maker.drawWide(cvs[0], 0.5, 0);
      maker.drawFace(cvs[0], 0, 0.5);
      maker.drawMarking(cvs[0], 0.5, 0.5);

      maker.drawSquare1(cvs[0], CharBuilder.INDEX_OWNJOINT, {
        cola: [255, 155, 192],
        col:  [233, 123, 160],
        colb: [201,  91, 128],
        mode: 'lineary3',
      });
      // 腕ひじ足ひざなど
      maker.drawForTun(cvs[0], CharBuilder.INDEX_TUNNEL8, {
        cola: [17, 238, 17],
        col : [238, 238, 221],
        colb: [153, 153, 51],
        isNarrow: true,
      });
      maker.drawSquare1(cvs[0], CharBuilder.INDEX_TUNNEL9, {
        cola: [238, 238, 221],
        col : [153, 153, 102],
        colb: [238, 238, 221],
      });
      maker.drawSquare1(cvs[0], CharBuilder.INDEX_TUNNEL10, {
        cola: [17, 17, 17],
        col : [153, 153, 153],
        colb: [204, 204, 204],
      });
      maker.drawSquare1(cvs[0], CharBuilder.INDEX_TUNNEL11, {
        cola: [17, 17, 17],
        col : [153, 153, 153],
        colb: [204, 204, 204],
      });

      maker.drawMobius(cvs[0], CharBuilder.INDEX_MOBIUS, {
      });
      maker.drawOwnBone(cvs[0], CharBuilder.INDEX_OWNBONE, {
      });
      maker.drawLogo(cvs[0]);

      if (!param.usecolor) {
        const c = cvs[0].getContext('2d');
        const w = c.canvas.width;
        const h = c.canvas.height;
        const img = c.getImageData(0, 0, w, h);
        for (let y = 0; y < h; ++y) {
          for (let x = 0; x < w; ++x) {
            let offset = (w * y + x) * 4;
            let r = img.data[offset];
            let g = img.data[offset+1];
            let b = img.data[offset+2];
            let a = img.data[offset+3];
            /*
            // グレースケールと少し暗く
            let lv = (r * 79 + g * 150 + b * 27) / 256 - 17;
            img.data[offset] = lv - 17;
            img.data[offset+1] = lv - 17;
            img.data[offset+2] = lv;
            */

            // グレースケールと少し明るめ
            let lv = (r * 79 + g * 150 + b * 27) / 256;
            lv = Math.min(255, lv * 1.3);
            img.data[offset] = lv - 17;
            img.data[offset+1] = lv - 17;
            img.data[offset+2] = lv;
          } 
        }
        c.putImageData(img, 0, 0);
      }
    }

    if (isWrite) {
      for (let i = 0; i < 2; ++i) {
        const blob = await this.toBlob(cvs[i]);
        await this.makeFile(dh,
          [],
          param.textures[i],
          blob,
        );
      }
    }

    { // .pmx
      const writer = new CharBuilder();
      writer.make(param);
      const bufs = writer.makeBuffer();

      if (isWrite) {
        await this.makeFile(dh,
          [],
          'parametmiku.pmx',
          new Blob(bufs),
        );
      }
    }
    console.log('makeFiles end', isWrite);
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

