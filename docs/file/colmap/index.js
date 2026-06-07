
const _pad = (v, n = 2) => {
  return new String(v).padStart(n, '0');
};

class Misc {
  constructor() {
    this.consoles = [];
    /** カーソル */
    this.c = 0;
  }

  /**
   * .bin の文字列を取得してカーソルを進める。
   * null 止め。
   * @param {DataView} p 
   */
  rbinstr(p) {
    const buf = new Uint8Array(256);
    let len = 0;
    for (let i = 0; i < 256; ++i) {
      const val = p.getUint8(this.c + i);
      if (val === 0) {
        len = i;
        break;
      }
      buf[i] = val;
    }
    const text = new TextDecoder().decode(buf.slice(0, len));
    return text;
  }

  async initialize() {
    this.setListener();

    this.update();
  }

  async log(...args) {
    const d = new Date();
    const text = `${d.toLocaleTimeString()}.${new String(d.getMilliseconds()).padStart(3, '0')},` + args.join(',');
    this.consoles.unshift(text);
    const el = document.getElementById('console');
    if (!el) {
      return;
    }
    const br = document.createElement('br');
    el.insertBefore(br, el.firstChild);
    const node = document.createTextNode(text);
    el.insertBefore(node, el.firstChild);
  }

  makeFilename(num) {
    return `${this.prefix}${_pad(num, this.num)}.${this.ext}`;
  }

  async view() {
    const pads = navigator.getGamepads();
    if (!pads) {
      return;
    }
    let first = true;
    for (let i = 0; i < pads.length; ++i) {
      const pad = pads[i];
      const el = document.getElementById(`padview${i}`);
      if (!el) {
        continue;
      }
      if (!pad) {
        el.textContent = `null ${i}`;
        continue;
      }

      if (first) {
        if (this.nextDual) {
          this.nextDual = false;
          await this.dualVibe(pad, this.strong, this.weak);
        }
        if (this.nextTrigger) {
          this.nextTrigger = false;
          await this.triggerVibe(pad);
        }
        first = false;
      }

      let str = ``;
      for (let j = 0; j < pad.buttons.length; ++j) {
        str += `,${j}-${pad.buttons[j].value}`;
      }
      str += '<br />';
      for (let j = 0; j < pad.axes.length; ++j) {
        let val = pad.axes[j];
        if (j !== 9) {
          str += `,${val.toFixed(6)}`;
        } else {
          str += `,${(Math.round(val * 7) + 7) / 2}`;
        }
        if ((j % 3) === 2) {
          str += '<br />';
        }
      }
      str += `,${pad.id}`;
      str += `,${pad.mapping}, actu${(pad.vibrationActuator !== null)}, ${pad.vibrationActuator?.effects}`;

      el.innerHTML = str;
    }
  }

  update() {
    window.requestAnimationFrame(() => {
      this.update();
    });

    this.view();
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
        this.onDrop(ev.dataTransfer.files[0]);
      });
    }

    for (const k of ['startcount', 'addcount', 'outcount']) {
      const el = document.getElementById(k);
      if (!el) {
        continue;
      }
      const _update = () => {
        const val = Number.parseFloat(el.value);
        const viewel = document.getElementById(`${k}view`);
        if (viewel) {
          viewel.textContent = `${val}`;
        }
      };
      el?.addEventListener('input', _update);
      _update();
    }

  }

  /**
   * 
   * @param {File} file 
   */
  onDrop(file) {
    const re = /(?<fw>.+)\.(?<ext>[^\.]+)$/;
    const m = re.exec(file.name);
    if (!m) {
      this.onBin(file);
      return;
    }
    const obj = {
      fw: m.groups['fw'],
      ext: m.groups['ext'],
    };
    switch (obj.ext) {
      case 'bin':
        this.onBin(file, obj);
        break;
    }
  }

  /**
   * 
   * @param {File} file 
   * @param {*} obj 
   */
  async onBin(file, obj) {
    let result = {};
    switch (obj.fw) {
      case 'cameras':
        result = await this.onCameras(file);
        break;
      case 'images':
        result = await this.onImages(file);
        break;
      case 'points3D':
        result = await this.onPoints3D(file);
        break;
    }
    console.log('onBin', result);
  }

  /**
   * 
   * @param {File} file 
   */
  async onCameras(file) {
    const ab = await file.arrayBuffer();
    const p = new DataView(ab);
    const ret = {cams: []};
    this.c = 0;
    ret.num = this.read64(p);
    for (let i = 0; i < ret.num; ++i) {
      const cam = {};
      ret.cams.push(cam);
    }
    return ret;
  }

  /**
   * 
   * @param {File} file 
   */
  async onImages(file) {
    const ab = await file.arrayBuffer();
    const p = new DataView(ab);
    const ret = {images: []};
    this.c = 0;
    ret.num = this.read64(p);
    for (let i = 0; i < ret.num; ++i) {
      const image = {};
      ret.images.push(image);
    }
    return ret;
  }

  /**
   * 
   * @param {File} file 
   */
  async onPoints3D(file) {
    const ab = await file.arrayBuffer();
    const p = new DataView(ab);
    const ret = {points: []};
    this.c = 0;
    ret.num = this.read64(p);
    for (let i = 0; i < ret.num; ++i) {
      const pt = {tracks: []};
      pt.id = this.read64(p);
      pt.pos = this.readds(p, 3); // x,y,z
      pt.col = this.readds(p, 3); // r,g,b
      pt.error = this.readds(p, 1)[0]; // error
      pt.trackNum = this.read64(p); // track[]
      for (let j = 0; j < pt.trackNum; ++j) {
        const track = {};
        track.id = this.read64(p);
        track.index = this.read64(p);
        // pt.tracks.push(track);
      }
      ret.points.push(pt);
    }
    console.log('onPoints3D', this.c, ab.byteLength);
    return ret;
  }

  /**
   * 
   */
  async makePly(param) {
    const bufs = [];
    {
      const lines = [
        `ply`,
        `format binary_little_endian 1.0`,
        `element vertex ${param.points.length}`,
        `property float x`,
        `property float y`,
        `property float z`,
        `property uchar red`,
        `property uchar green`,
        `property uchar blue`,
        `end_header`,
        
      ];
      bufs.push(lines.join('\n'));
    }
    // バイナリ部
    const pbuf = new Uint8Array(param.num * 15);
    const p = new DataView(pbuf);
    let offset = 0;
    for (let i = 0; i < param.num; ++i) {
      const pt = param.points[i];
      p.setFloat32(offset, pt.pos[0], true);
      p.setFloat32(offset+4, pt.pos[1], true);
      p.setFloat32(offset+8, pt.pos[2], true);
      offset += 12;
      p.setUint8(offset, pt.col[0]);
      p.setUint8(offset+1, pt.col[1]);
      p.setUint8(offset+2, pt.col[2]);
      offset += 3;
    }
    bufs.push(pbuf);
    return bufs;
  }

  /**
   * 
   * @param {DataView} p 
   * @param {number} n 
   */
  reads32(p, n) {
    const ret = new Int32Array(n);
    for (let i = 0; i < n; ++i) {
      ret[i] = p.getInt32(this.c, true);
      this.c += 4;
    }
    return ret;
  }

  /**
   * 
   * @param {DataView} p 
   * @param {number} n 
   * @returns 
   */
  readds(p, n) {
    const ret = new Float64Array(n);
    for (let i = 0; i < n; ++i) {
      ret[i] = p.getFloat64(this.c, true);
      this.c += 8;
    }
    return ret;
  }

  /**
   * 
   * @param {DataView} p 
   * @param {number} n 
   * @returns 
   */
  readfs(p, n) {
    const ret = new Float32Array(n);
    for (let i = 0; i < n; ++i) {
      ret[i] = p.getFloat32(this.c, true);
      this.c += 4;
    }
    return ret;
  }

  /**
   * 32bitのみ採用する。一応 -1(s64) は読む
   * @param {DataView} p 
   * @param {number} c 
   */
  read64(p) {
    let val = p.getUint32(this.c, true);
    this.c += 4;
    let h = p.getUint32(this.c, true);
    this.c += 4;
    if (h === 0xffffffff) {
      val -= (2 ** 32);
    }
    return val;
  }

}

const misc = new Misc();
misc.initialize();
