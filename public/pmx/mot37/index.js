/**
 * @file index.js
 */

const _pad = (v, n = 2) => {
  return String(v).padStart(n, '0');
};

/**
 * クォータニオンを取得
 * @param {number} index 0,1,2 
 * @param {number} deg 
 * @returns 
 */
const _qaxis = (index, deg) => {
  let cs = Math.cos(deg * Math.PI / 180 * 0.5);
  let sn = Math.sin(deg * Math.PI / 180 * 0.5);
  const ret = [0, 0, 0, cs];
  ret[index] = sn;
  return ret;
};

/**
 * クォータニオン積
 * @param {number[]} a 
 * @param {number[]} b 
 * @returns 
 */
const _qmul = (a, b) => {
  const rea = a[3];
  const reb = b[3];
  const ret = [
    a[0] * reb + b[0] * rea + a[1] * b[2] - a[2] * b[1],
    a[1] * reb + b[1] * rea + a[2] * b[0] - a[0] * b[2], 
    a[2] * reb + b[2] * rea + a[0] * b[1] - a[1] * b[0],
    rea * reb - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
  ];
  return ret;
};

class Bone {
  constructor() {
    this.name = '';
    this.frame = 0;
    this.p = [0, 0, 0];
    this.q = [0, 0, 0, 1];
    /**
     * x,y, x,y 0-127
     */
    this.rs = [20, 20, 107, 107];
    this.xs = [20, 20, 107, 107];
    this.ys = [20, 20, 107, 107];
    this.zs = [20, 20, 107, 107];
    /**
     * morph only
     */
    this.weight = 0;
  }

  makeArray() {
    const r = this.rs;
    const x = this.xs;
    const y = this.ys;
    const z = this.zs;
    return [
      x[0], y[0], z[0], r[0], x[1], y[1], z[1], r[1],
      x[2], y[2], z[2], r[2], x[3], y[3], z[3], r[3],

            y[0], z[0], r[0], x[1], y[1], z[1], r[1],
      x[2], y[2], z[2], r[2], x[3], y[3], z[3], r[3], 1,

                  z[0], r[0], x[1], y[1], z[1], r[1],
      x[2], y[2], z[2], r[2], x[3], y[3], z[3], r[3], 1, 0,

                        r[0], x[1], y[1], z[1], r[1],
      x[2], y[2], z[2], r[2], x[3], y[3], z[3], r[3], 1, 0, 0,
    ];
  }
}

class MotionData {
  constructor() {
    this.header = {
      /**
       * 30char
       */
      magic: `Vocaloid Motion Data 0002\x00\x00\x00\x00\x00`,
      name: 'modelname',
    };
    /**
     * @type {Bone[]}
     */
    this.bones = [];
    /**
     * @type {Bone[]}
     */
    this.morphs = [];
  }
}

class Misc {
  constructor() {

    this.names = [
      //`center`, // en
      `b004tree`,
      `b006tree`,
      `b008tree`,
      `b010tree`,
      `b012tree`,
      `b015tree`,
      `b017tree`,
      `b019tree`,
      `b021tree`,
      `b023tree`,
    ];

    this.morphs = [
      'rmul',
      'gmul',
      'bmul',
    ];
  }

  /**
   * 初期化する
   */
  async initialize() {
    this.setListener();
  }

  /**
   * 
   * @param {File} file 
   */
  async gzip(file) {
    const cs = new CompressionStream('gzip');
    const ab = await file.arrayBuffer();
    const stream = new Response(ab).body.pipeThrough(cs);
    const conv = await new Response(stream).arrayBuffer();
    console.log('compress', conv.byteLength);
    return conv;
  }

  /**
   * 
   * @param {File} file 
   */
  async ungzip(file) {
    const ds = new DecompressionStream('gzip');
    const ab = await file.arrayBuffer();
    const stream = new Blob([ab]).stream().pipeThrough(ds);
    const conv = await new Response(stream).arrayBuffer();
    console.log('uncompressed', conv.byteLength);
    return conv;
  }

  setListener() {
    const handleDrag = (ev, type) => {
      ev.preventDefault();
      ev.stopPropagation();
      ev.dataTransfer.dropEffect = type;
    };
    {
      const el = window;
      el?.addEventListener('dragover', (ev) => {
        handleDrag(ev, 'none');
      });
      el?.addEventListener('drop', ev => {
        handleDrag(ev, 'none');
      });
    }
    {
      const el = document.getElementById('compress');
      el?.addEventListener('dragover', (ev) => {
        handleDrag(ev, 'copy');
      });
      el?.addEventListener('drop', async ev => {
        handleDrag(ev, 'copy');
        const file = ev.dataTransfer.files[0];
        const ab = await this.gzip(file);
        this.downloadFile(new Blob([ab]), `${file.name}.gz`);
      });
    }
    {
      const el = document.getElementById('decomp');
      el?.addEventListener('dragover', ev => {
        handleDrag(ev, 'copy');
      });
      el?.addEventListener('drop', async ev => {
        handleDrag(ev, 'copy');
        const re = /(?<base>.+)(?<ext>\..+)$/;
        const file = ev.dataTransfer.files[0];
        const ab = await this.ungzip(file);
        const m = re.exec(file.name);
        let name = `a.dat`;
        if (m) {
          name = `${m.groups['base']}`;
        }
        this.downloadFile(new Blob([ab]), name);
      });
    }

    {
      const el = document.getElementById('go');
      el?.addEventListener('click', () => {
        this.downloadMotion();
      });
    }

  }

  /**
   * 
   */
  async downloadMotion() {
    console.log('downloadMotion');
    const motionData = new MotionData();
    { // モーション
      for (let i = 0; i <= 3; ++i) {
        let frame = i * 10;
        for (let j = 0; j <= 4; ++j) {
          const obj = new Bone();
          obj.frame = frame;
          obj.name = `b0${15 + j * 2}tree`;

          let sgn = (((j + i) & 1) !== 0) ? -1 : 1;

          switch (j) {
          case 0:
            obj.q = _qaxis(2, 90 * sgn);
            break;
          case 1:
            obj.q = _qaxis(2, 90 * sgn);
            break;
          case 2:
            obj.q = _qaxis(2, 90 * sgn);
            break;
          case 3:
            obj.q = _qaxis(2, 90 * sgn);
            break;
          case 4:
            obj.q = _qaxis(2, 90 * sgn);
            break;
          }

          motionData.bones.push(obj);
        }
      }

    }
    {
      
    }

    const ab = await this.makeFile(motionData);
    this.downloadFile(new Blob([ab]), `a.vmd`);
  }

  /**
   * 
   * @param {Blob} blob 
   * @param {string} name 
   */
  downloadFile(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
  }

  /**
   * 
   * @param {MotionData} motionData 
   * @returns 
   */
  async makeFile(motionData) {
    const buf = new ArrayBuffer(65536);
    const p = new DataView(buf);
    let c = 0;

    /**
     * 
     * @param {string} ascii 
     * @param {number} num 
     */
    const writeText = (ascii, num) => {
      const len = ascii.length;
      for (let i = 0; i < num; ++i) {
        const chr = (i < len) ? ascii.codePointAt(i) : 0;
        p.setUint8(c, chr);
        c += 1;
      }
    };

    {
      writeText(motionData.header.magic, 30);
      writeText(motionData.header.name, 20);
    }

    {
      /**
       * @type {Bone[]}
       */
      const ks = motionData.bones;
      const num = ks.length;
      p.setInt32(c, num, true);
      c += 4;

      for (let i = 0; i < num; ++i) {
        const k = ks[i];
        writeText(k.name, 15);
        p.setInt32(c, k.frame, true);
        c += 4;
        for (let j = 0; j < 3; ++j) {
          p.setFloat32(c, k.p[j], true);
          c += 4;
        }
        for (let j = 0; j < 4; ++j) {
          p.setFloat32(c, k.q[j], true);
          c += 4;
        }
        const vs = k.makeArray();
        for (let j = 0; j < 64; ++j) {
          p.setUint8(c, vs[j]);
          c += 1;
        }
      }
    }
    {
      /**
       * @type {Bone[]}
       */
      const ks = motionData.morphs;
      const num = ks.length;
      p.setInt32(c, num, true);
      c += 4;
      for (let i = 0; i < num; ++i) {
        const k = ks[i];
        writeText(k.name, 15);
        p.setInt32(c, k.frame, true);
        c += 4;
        p.setFloat32(c, k.weight, true);
        c += 4;
      }
    }
    { // cam
      const num = 0;
      p.setInt32(c, num, true);
      c += 4;
    }
    { // light
      const num = 0;
      p.setInt32(c, num, true);
      c += 4;
    }
    { // shadow
      const num = 0;
      p.setInt32(c, num, true);
      c += 4;
    }
    { // visible, ik
      const num = 0;
      p.setInt32(c, num, true);
      c += 4;
    }

    return buf.slice(0, c);
  }

}

const misc = new Misc();
misc.initialize();
