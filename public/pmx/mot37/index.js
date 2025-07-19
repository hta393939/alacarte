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
  const ang = deg * Math.PI / 180 * 0.5;
  let cs = Math.cos(ang);
  let sn = Math.sin(ang);
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
  static XAXIS = 0;
  static YAXIS = 1;
  static ZAXIS = 2;

  constructor() {
    this.param = {
      sec: 6,
      step: 10,
      repeatnum: 1,
      ampdeg: 90,
      maxframe: 300,
      loopsec: 1,
      seed: 1,
      motiontype: 1,
      crosstype: 1,
      usemirror: false,
      floorn: 2,
    };

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

  seed(seed) {
    this.param.seed = seed;
  }

  rnd() {
    let x = this.param.seed;
    const A = 214013;
    const C = 2531011;
    x = x * A + C;
    this.param.seed = x % (2 ** 32);
    {
      const el = document.getElementById('inseedview');
      if (el) {
        el.textContent = `${this.param.seed} ${new Date().toLocaleTimeString()}`;
      }
    }
    return ((Math.floor(x / 65536)) & 32767);
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

    for (const k in this.param) {
      const el = document.getElementById(k);
      const viewel = document.getElementById(`${k}view`);
      if (!el || !viewel) {
        continue;
      }
      const _update = () => {
        const val = Number.parseFloat(el.value);
        if (!Number.isFinite(val)) {
          return;
        }
        viewel.textContent = `${val}`;
      };
      el.addEventListener('input', () => {
        _update();
      });
      _update();
    }

    {
      const el = document.getElementById('gomotion1');
      el?.addEventListener('click', () => {
        this.downloadMotion1();
      });
    }
    {
      const el = document.getElementById('gomotion2');
      el?.addEventListener('click', () => {
        this.downloadMotion2();
      });
    }
    {
      const el = document.getElementById('gomotion3');
      el?.addEventListener('click', () => {
        this.downloadMotion3();
      });
    }
    {
      const el = document.getElementById('gomotion4');
      el?.addEventListener('click', () => {
        this.downloadMotion4();
      });
    }

  }

  /**
   * 三角関数の値を返す
   * @param {number} topo 
   * @param {number} n 
   * @returns 
   */
  gettri(topo, n) {
    let v = (topo + 100 * n) % n;
    if (v === 0) { // 0deg
      return { cos: 1, sin: 0 };
    }
    if (v === n / 2) { // 180deg
      return { cos: -1, sin: 0 };
    }
    if (v === n / 4) { // 90deg
      return { cos: 0, sin: 1 };
    }
    if (v === n * 3 / 4) { // 270deg
      return { cos: 0, sin: -1 };
    }

    const q2 = Math.sqrt(0.5);
    if (v === n / 8) { // 45deg
      return { cos: q2, sin: q2 };
    }
    if (v === n * 3 / 8) { // 135deg
      return { cos: -q2, sin: q2 };
    }
    if (v === n * 5 / 8) {
      return { cos: -q2, sin: -q2};
    }
    if (v === n * 7 / 8) {
      return { cos: q2, sin: -q2 };
    }

    const ang = topo * 2 * Math.PI / n;
    return { cos: Math.cos(ang), sin: Math.sin(ang) };
  }

  /**
   * nの倍数にfloorする
   * @param {number} x 
   * @returns 
   */
  nfloor(x, n) {
    return Math.floor(x / n) * n;
  }

  gatherParam() {
    const ks = Object.keys(this.param);
    for (const key of ks) {
      const el = document.getElementById(`${key}`);
      if (!el) {
        continue;
      }
      const val = Number.parseFloat(el.value);
      if (!Number.isFinite(val)) {
        this.param[key] = el.checked;
        continue;
      }
      this.param[key] = val;
    }
    return this.param;
  }

  /**
   * 
   */
  async downloadMotion_keep() {
    console.log('downloadMotion keep');
    const param = this.gatherParam();
    const motionData = new MotionData();

    const deg1 = 90;
    const poses = {
      p0: [deg1, -deg1, -deg1, deg1, 0],
      p1: [0, 0, 0, 0, 0],
      pt: [0, 0, 0, 0, 0],
    };

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
   */
  async downloadMotion2() {
    console.log('downloadMotion2');
    const param = this.gatherParam();
    const motionData = new MotionData();

    const { step, repeatnum, ampdeg, maxframe, seed } = param;

    const filename = `u2_${seed}.vmd`;

    let deg1 = ampdeg;
    let deg2 = ampdeg;
    const poses = {
      p0: [deg1, -deg1, -deg1, deg1, 0],
      p1: [0, 0, 0, 0, 0],
      pt: [0, 0, 0, 0, 0],
    };

//// モーション
    for (let n = 0; n < repeatnum * 0 + 11; ++n) {
      let keydurs = [8, 8, 8, 6];
      let keyoffsets = [0];
      for (let i = 0; i < keydurs.length; ++i) {
        let val = keydurs[i];
        keyoffsets.push(keyoffsets[keyoffsets.length - 1] + val);
      }

      const kon = keyoffsets.length;
      for (let i = 0; i <= kon; ++i) {
        if (i === kon && n < repeatnum -1) {
          continue;
        }
        let frame = n * 30 + keyoffsets[i];
        if (frame > maxframe) {
          break;
        }

        // Y +++ 21
        // Y -+- 90
        const subbones = [
          `b006tree`,
          `b008tree`, // backward
          `b010tree`,
          `b012tree`, // top

          `b017tree`,
          `b019tree`, // forward
          `b021tree`,
          `b023tree`, // top
        ];
        /**
         * upper degs
         */
        let degs = [
          21, 21, 21, 21, -90, -90, +90, -90
        ];

        for (let j = 0; j < 8; ++j) { // ボーンループ
          const obj = new Bone();
          obj.frame = frame;
          //obj.name = `b0${15 + j * 2}tree`;
          obj.name = subbones[j];

          let sgn1 = 0;
          let sgn2 = 0;
          if ((i & 1) === 0) { // even
            sgn2 = (i === 0 || i === 4 || i === 8) ? 1 : -1;
          } else { // odd
            sgn1 = (i === 1 || i === 5 || i === 9) ? 1 : -1;
          }

          const q2 = _qaxis(Misc.YAXIS, degs[j]);
          switch (j) {
          case 0:
            obj.q = _qaxis(Misc.ZAXIS, -deg1 * sgn2);
            break;
          case 1:
            obj.q = _qaxis(Misc.ZAXIS, -deg1 * sgn1);
            break;
          case 2:
            obj.q = _qaxis(Misc.ZAXIS, deg1 * sgn2);
            break;
          case 3:
            obj.q = _qaxis(Misc.ZAXIS, deg1 * sgn1);
            break;

          case 4:
            obj.q = _qaxis(Misc.ZAXIS, -deg1 * sgn2);
            break;
          case 5:
            obj.q = _qaxis(Misc.ZAXIS, -deg1 * sgn1);
            break;
          case 6:
            obj.q = _qaxis(Misc.ZAXIS, deg1 * sgn2);
            break;
          case 7:
            obj.q = _qaxis(Misc.ZAXIS, deg1 * sgn1);            
            break;
          }
          obj.q = _qmul(obj.q, q2);

          motionData.bones.push(obj);
        }
      }

    }
    { // 表情無し
    }

    const ab = await this.makeFile(motionData);
    this.downloadFile(new Blob([ab]), filename);
  }

  /**
   * topology challenge
   * トポロジーが違うとフレームが違うのでかなりめんどいな...
   */
  async downloadMotion3() {
    console.log('downloadMotion3');
    const na = Number.NaN;

    const param = this.gatherParam();
    const {
      step, loopsec, repeatnum, ampdeg, maxframe,
      seed,
      usemirror,
      floorn,
      motiontype,
      crosstype,
    } = param;
    // 1 or 2 or 6

    /**
     * 1ループフレーム数
     */
    let lfn = 30 * loopsec;

    const crossaxis = Misc.YAXIS;
    const motionaxis = Misc.ZAXIS;

    //// モーション
    let boneNum = 10;
    for (let lr = 0; lr < (usemirror ? 2 : 1); ++lr) {
      const motionData = new MotionData();

      const lrstrs = ['l', 'r', ''];
      const seed16 = seed.toString(16).padStart(8, '0');
      const filename = `m3${crosstype}_${lfn}_${floorn}_${lrstrs[usemirror ? lr : 2]}${seed16}.vmd`;
      const lrsgn = [1, -1][lr];

      const subbones = [
        { name: `b004tree` },
        { name: `b006tree` },
        { name: `b008tree` }, // backward
        { name: `b010tree` },
        { name: `b012tree` }, // top

        { name: `b015tree` },
        { name: `b017tree` },
        { name: `b019tree` }, // forward
        { name: `b021tree` },
        { name: `b023tree` }, // top
      ];
      const motiondegs = [
        [ampdeg,  ampdeg,ampdeg,ampdeg,ampdeg, ampdeg, ampdeg,ampdeg,ampdeg,ampdeg],
        [ampdeg,  ampdeg,ampdeg,ampdeg,ampdeg, ampdeg, ampdeg,ampdeg,ampdeg,ampdeg],
        [ampdeg,  ampdeg,ampdeg,ampdeg,ampdeg, ampdeg, ampdeg,ampdeg,ampdeg,ampdeg * 2],
        [ampdeg,  ampdeg,ampdeg,ampdeg,ampdeg, ampdeg, ampdeg,ampdeg,ampdeg,ampdeg * 3],
      ];
      /**
       * 垂直軸度数
       */
      const crossdegs = [
        [na,  0,  0,  0,  0, na,   0,   0,   0,   0 ],
        [na, 21, 21, 21, 21, na, -90, -90, +90, -90 ], // upper degs
        [na, na, na, na, na, 90, -90, -90, +90, -11 ], // lower degs
        [na, na, na, na, na,  0,   0,   0,   0,   0 ], // plane
        [na, na, na, na, na, na,  na,  na,   0,   0 ], // 2
      ];

      const bkvs = [];
      for (let i = 0; i < boneNum; ++i) {
        let kvs = [];
        // トポロジーの決定
        let rn = Math.floor(lfn / 2 / floorn);
        let rv = 0;
        while (rv === 0 || rv === lfn * 0.5) {
          const val = this.rnd() % rn; // 0 と lfn * 0.5 は個数が変わってめんどいので
          rv = val * floorn;
        }
        const inc = (this.rnd() % 2) * 2 - 1;
        //console.log('rv', rv);

        // cos が減少していく範囲なら true
        const halfAdd = this.nfloor(lfn * 0.5, floorn);
        if (inc < 0) {
          const t1 = lfn * 0.5 - rv;
          const cs = this.gettri(t1, lfn);
          kvs.push({ key: 0, val: cs.cos });

          kvs.push({ key: t1, val: -1 });
          kvs.push({ key: t1 + halfAdd, val: 1 });
          //kvs.push({ key: lfn, val: cs.cos });
        } else {
          const t1 = lfn - rv;
          const cs = this.gettri(t1, lfn);
          kvs.push({ key: 0, val: cs.cos });

          kvs.push({ key: t1, val: 1 });
          kvs.push({ key: t1 + halfAdd, val: -1 });
          //kvs.push({ key: lfn, val: cs.cos });
        }

        bkvs.push(kvs);
      }
      console.log('bkvs', bkvs);

      for (let j = 0; j < boneNum; ++j) { // ボーンループ
        /**
         * ボーンごと key, val
         */
        const kvs = bkvs[j];
        for (let n = 0; n < 21; ++n) { // 30 * 21 あれば十分
          const kon = kvs.length;
          for (let i = 0; i < kon; ++i) {
            const kv = kvs[i];
            let frame = n * lfn + kv.key;
            if (frame > maxframe) {
              break;
            }

            let obj = new Bone();
            obj.frame = frame;
            obj.name = subbones[j].name;

            const motiondeg = motiondegs[motiontype][j];
            const crossdeg = crossdegs[crosstype][j];
            if (!Number.isFinite(crossdeg)) {
              continue;
            }
            const q2 = _qaxis(crossaxis, crossdeg);
            obj.q = _qaxis(motionaxis, motiondeg * kv.val * lrsgn);
            obj.q = _qmul(obj.q, q2);
            motionData.bones.push(obj);
          }
        }

      }

      { // 表情無し
      }

      // 再ソートいらない
      const ab = await this.makeFile(motionData);
      this.downloadFile(new Blob([ab]), filename);
    }
    console.log('downloadMotion3');
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
   * ファイル化する
   * @param {MotionData} motionData 
   * @returns 
   */
  async makeFile(motionData) {
    const buf = new ArrayBuffer(1024 * 128);
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
