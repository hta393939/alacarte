/**
 * @file index.js
 */

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
    this.STORAGE = 'miku34';
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

/**
 * 
 * @param {File} file 
 */
  async makeApplyClip(file) {
    const ab = await file.arrayBuffer();
    const parser = new PMX.Maker();
    this.parser = parser;
    parser.parse(ab);

    const maker = new ApplyMaker();
    const result = maker.analyzeFileRoss(parser);

    result.push('');
    let str = result.join('\n');
    await navigator.clipboard.writeText(str);
  }

/**
 * 位置ベース。クリップボード用。
 * @param {PMX.Parser} parser 
 * @returns {string[]} 行ごとに返す
 */
  analyzeFileRoss(parser) {
/**
 * 物理変形
 */
    const _usePhy = document.getElementById('usephy')?.checked;

/**
 * gui group
 */
    const RIGID_DEFAULT_GROUP = 2;

    let rc = 93;
    //const rce = 94; // 無い
    let rtop = 785;
    const rpos = [-1.37018, 14.7010, -1.96364];

    let lc = 95;
    //const lce = 96; // 無い
    let ltop = 4707;
    const lpos = [-rpos[0], rpos[1], rpos[2]];

    console.log(parser.vts[rtop].p, parser.vts[ltop].p);

    for (let i = 0; i < parser.bones.length; ++i) {
      const b = parser.bones[i];
      if (b.nameJa === '右胸') {
        rc = i;
        console.info('found rc', rc);
      } else if (b.nameJa === '左胸') {
        lc = i;
        console.info('found lc', lc);
      }
    }

// 材質で絞るためのカウント
    let _ficount = 0;
    let mtl = null;
    const mtlIndex = 10;
    for (let i = 0; i < parser.materials.length; ++i) {
      mtl = parser.materials[i];
      if (mtl.nameJa === '\u88f8') {
//            if (mtlIndex === i) {
        console.log('_ficount', _ficount);
        break;
      }
      _ficount += mtl._faceIndexNum;
      console.log(mtl._faceIndexNum / 3);
    }

// 対象頂点を絞る
    const oneIndices = new Set();

    const R = 0;
    const L = 1;
    const lrname = ['right', 'left'];
/**
 * 最小が有効扱いするので大きい値
 */
    const NA = 999999;

    let rmin = 99999;
    let lmin = 99999;

    for (let i = 0; i < mtl._faceIndexNum; ++i) {
      const index = _ficount + i;
      const vtxIndex = parser.faceIndices[index];
/**
 * 頂点1個
 */
      const vtx = parser.vts[vtxIndex];
      vtx._analyze = {
        target: false,
        ring: NA,
        lr: NA,
      };

// 影響1個
      if (vtx.deformType !== PMX.Vertex.DEFORM_BDEF1) {
        continue;
      }
      let found = NA;
      if (vtx.joints.includes(rc)) {
        found = R;
      }
      if (vtx.joints.includes(lc)) {
        found = L;
      }
      if (found == NA) {
        continue;
      }

      vtx._analyze.lr = found;
      vtx._analyze.target = true;

      oneIndices.add(vtxIndex);

      {
        const dist = _dist(vtx.p, rpos);
        if (dist < rmin) {
          rmin = dist;
          rtop = vtxIndex;
          //console.log('r found', vtxIndex, rmin);
        }
      }
      {
        const dist = _dist(vtx.p, lpos);
        if (dist < lmin) {
          lmin = dist;
          ltop = vtxIndex;
          //console.info('l found', vtxIndex, lmin);
        }
      }
    }
    parser.vts[rtop]._analyze.ring = 0;
    parser.vts[ltop]._analyze.ring = 0;
    console.log('rtop, ltop', rtop, ltop, rmin, lmin);
    const targets = _settoarray(oneIndices);

    console.log('one, targets', oneIndices, targets);

// flood で ring 階層を更新していく
    const faceNum = mtl._faceIndexNum / 3;
    for (let i = 0; i < 14; ++i) {
      for (let j = 0; j < faceNum; ++j) { // 面ループ
        const index = _ficount + j * 3;

        const faceIndices = parser.faceIndices.slice(index, index + 3);
// map() の返り値が Type[] であるので最後に変換が入る
        const vs = Array.from(faceIndices).map(v => parser.vts[v]);

        const minRing = Math.min(...(vs.map(v => v._analyze?.ring ?? NA)));
        if (minRing == NA) {
          continue; // 何もしない
        }
        const minLR = Math.min(...vs.map(v => v._analyze?.lr ?? NA));

        for (let k = 0; k < 3; ++k) {
          const analyze = vs[k]._analyze;
          if (!analyze) {
            continue;
          }
          analyze.ring = Math.min(minRing + 1, analyze.ring);
          analyze.lr = minLR;
        }
      }
    }

/**
 * 各0～13段のインデックスに分離する
 */
    const ringNum = 14;
    const setset = [[], []];
    for (let i = 0; i < ringNum; ++i) {
      setset[R].push(new Set());
      setset[L].push(new Set());
    }

    for (const vi of targets) {
      const vtx = parser.vts[vi];
      if (vtx._analyze.ring >= ringNum) {
        continue;
      }
//            console.log('ring', vtx._analyze.lr, vtx._analyze.ring);
      setset[vtx._analyze.lr][vtx._analyze.ring].add(vi);
    }
    for (let i = 0; i < ringNum; ++i) {
      setset[R][i] = _settoarray(setset[R][i]);
      setset[L][i] = _settoarray(setset[L][i]);
    }

// リングごとに算出する
/**
 * 頂点トランスレートの場合
 */
    const adjustvts = [];
/**
 * モーフの場合
 */
    const morphs = [];

    const _node = new PMX.PMXNode();
    _node.nameJa = _usePhy ? '物理変形' : 'ボーン変形';
    const items = [];

    const bones = [];
/**
 * @type {PMX.Rigid[]}
 */
    const rigids = [];
/**
 * @type {PMX.Joint[]}
 */
    const joints = [];

    const _shapes = [
      { rr: 1, delta: 0.00 }, // 0
      { rr: 0.4, delta: -0.01 }, // 1
      { rr: 0.8, delta: 0.02 }, // 2
      { rr: 1.0, delta: 0.02 }, // 3
      { rr: 1.1, delta: 0.02 }, // 4
      { rr: 1.08, delta: 0.03 }, // 5
      { rr: 1.05, delta: 0.03 }, // 6
      { rr: 1, delta: 0.03 }, // 7 基準
      { rr: 1, delta: 0.01 }, // 8
      { rr: 1, delta: 0.01 }, // 9
      { rr: 1, delta: 0.02 }, // 10
      { rr: 1, delta: 0.02 }, // 11
      { rr: 1, delta: 0.02 }, // 12
      { rr: 1, delta: 0.02 }, // 13          
    ];

    for (let i = 0; i < 2; ++i) {
      const morph = new PMX.Morph();
      morphs.push(morph);
      morph.nameEn = `${lrname[i]}chest`;
      morph.nameJa = morph.nameEn;
      morph.panel = PMX.Morph.PANEL_ETC;
      morph.type = PMX.Morph.TYPE_VERTEX;

      let _preBoneName = ((i === R) ? '右' : '左') + '\u80f8';
      let _preRigidName = '' + _preBoneName;
/**
 * ウェイト影響ボーン
 */
      let _effectBoneName = '' + _preBoneName;
      let offsets = [0, 0, 0];
      let radius7 = -1;
      for (let j = ringNum - 1; j >= 0 ; --j) {
        const pts = setset[i][j].map(index => {
          return parser.vts[index].p;
        });
        const result = Util.Avg(pts);
        console.log('result', j, result);
        if (j === 7) {
          radius7 = result.radius;
        }
        let newradius = radius7;

        // ここまでのオフセットを足す
/**
 * このリングの重心
 * @type {V3}
 */
        const center = new V3(...result.avg);
/**
 * ボーン
 */
        const bone = new PMX.Bone();
        bones.push(bone);
        bone.nameEn = `${lrname[i]}chest${j}`;
        bone.nameJa = bone.nameEn;
        bone.p = center.clone().add(new V3(...offsets)).asArray();
        bone.bits = PMX.Bone.BIT_ROT
          | PMX.Bone.BIT_MOVE
          | PMX.Bone.BIT_VISIBLE
          | PMX.Bone.BIT_LOCALAXIS
          | PMX.Bone.BIT_CONTROL
        //    | PMX.Bone.BIT_AFTERPHY // 物理後
        ;
        bone.xLocalVector = new V3(...result.normal).scale(-1).asArray();
        const basis = Util.MakeBasisLH(...bone.xLocalVector);
        bone.zLocalVector = new V3(...basis[0]).scale(-1).asArray();
        bone._parentName = _preBoneName;
        _preBoneName = bone.nameJa;
/**
 * フレーム内アイテム
 */
        const item = new PMX.NodeItem();
        item._parentName = _node.nameJa;
        item._itemName = bone.nameJa;
        items.push(item);
/**
 * 物理剛体
 */
        const rigid = new PMX.Rigid();
        rigid.nameJa = bone.nameJa;
        rigid.nameEn = bone.nameEn;
        rigid._boneName = bone.nameJa;
        //rigid.type = _usePhy ? PMX.Rigid.TYPE_DYNAMIC_POS : PMX.Rigid.TYPE_STATIC;
        rigid.type = _usePhy ? PMX.Rigid.TYPE_DYNAMIC : PMX.Rigid.TYPE_STATIC;
        rigid.shape = PMX.Rigid.SHAPE_SPHERE;
        rigid.p = [...bone.p];
/**
 * 半径
 */
        const rr = (newradius >= 0) ? newradius : result.radius;
        rigid.size = [rr, 1, 1];
        rigid.setUIGroup(RIGID_DEFAULT_GROUP);
        rigid.setUINots(2);
        rigid.moveDamping = 0;
        rigid.rotDamping = 0;
        //rigid.mass = 0.002;
        rigid.mass = 0.2;
        //rigid.mass = 1;
        rigid.friction = 100;
        rigid.pong = 0;

/**
 * ジョイント
 */
        const joint = new PMX.Joint();
        {
          if (j >= 1 && j <= 7) {
          //if (j === 7) {
            joint._rigidName = [_preRigidName, rigid.nameJa];
            _preRigidName = rigid.nameJa;
            joint.nameEn = `j_${i}_${j}`;
            joint.nameJa = joint.nameEn;
            joint.p = [...rigid.p];
            const dp = 0;
            const dr = (j === 7) ? /*90*/ 10 : 10;
            joint.moveUpper = [dp, dp, dp];
            joint.moveLower = [-dp, -dp, -dp];
            joint.rotUpper = [_deg2rad(dr), _deg2rad(dr), _deg2rad(10 * 0)];
            joint.rotLower = [_deg2rad(-dr), _deg2rad(-dr), _deg2rad(-10 * 0)];
            joint.springMove = [0, 0, 0];
            joint.springRot = [50, 50, 50];
            joints.push(joint);

            rigids.push(rigid);
          }

          if (j >= 8) { // 根本ボーン         
            //bone.layer = 1;
          } else if (j === 7) {
            _effectBoneName = bone.nameJa;  
            //bone.layer = 2;
          } else if (j <= 6) { // endボーン
            _effectBoneName = bone.nameJa;
            bone.bits |= PMX.Bone.BIT_AFTERPHY;
            //bone.layer = 3;
          }
        }

// 頂点
        for (const index of setset[i][j]) {
          const vtx = parser.vts[index];

          const vm = new PMX.VertexMorph();
          vm._parentName = morph.nameJa;
          // 一番最後に足すためのインデックス
          vm._index = morph.vertexMorphs.length;
          vm.target = index;
          morph.vertexMorphs.push(vm);

          // NOTE: 破壊している
          const adjust = new V3(...offsets);
          if (newradius >= 0) {
            const diff = new V3(...vtx.p).sub(center);
            const rr = diff.length() / (result.radius || 1) * newradius * _shapes[j].rr;
            const dir = diff.clone().normalize();
            adjust.add(center).add(dir.scale(rr)).sub(new V3(...vtx.p));
          }
          vm.offset = adjust.asArray();
          vtx.p = new V3(...vtx.p).add(adjust).asArray();
// 頂点変形を足す
          if (true) {
            //vtx._boneName = [bone.nameJa, '', '', ''];
            vtx._boneName = [_effectBoneName, '', '', ''];
          }
          adjustvts.push(vtx);
        }
        // オフセットに法線とちょこっとを足す
        const delta = _shapes[j].delta;
        offsets[0] += - result.normal[0] * delta;
        offsets[1] += - result.normal[1] * delta;
        offsets[2] += - result.normal[2] * delta;
      }
    }

// 行返す
    const lines = [];
    if (false) {
      for (const morph of morphs) {
        lines.push(...morph.toLines());
      }
    } else {
      // 0.2.7.5 で使えた
      for (const bone of bones) {
        lines.push(bone.toCSV());
      }
      {
        lines.push(_node.toCSV());
        for (const item of items) {
          lines.push(item.toCSV());
        }
      }

      for (const vtx of adjustvts) {
        lines.push(vtx.toCSV());
      }
      for (const b of rigids) {
        lines.push(b.toCSV());
      }
      for (const joint of joints) {
        lines.push(joint.toCSV());
      }
    }
    console.log('終わり', setset);
    return lines;
  }

  getCommonOptions() {
    const param = {
      texprefix: document.getElementById('texprefix')?.value || 'a',
      belt: Number.parseFloat(document.getElementById('belt')?.value ?? 1),
      pow2: Number.parseFloat(document.getElementById('pow2element')?.value ?? -3),
//            denom: Number.parseFloat(document.getElementById('denom')?.value ?? 1),
      usephy: document.getElementById('usephy')?.checked,
/**
 * ik 書き出しするかどうか
 */
      useik: document.getElementById('useikelement')?.checked,
    };
    param.scale = 2 ** param.pow2;
    param.denom = 1 / param.scale;
    return param;
  }

  saveSetting() {
    console.log('saveSetting called');
    const obj = {
      texprefix: document.getElementById('texprefix').value,
    };
    const s = JSON.stringify(obj);
    window.localStorage.setItem(this.STORAGE, s);
  }

  loadSetting() {
    const s = window.localStorage.getItem(this.STORAGE);
    let obj = {
      texprefix: 'g',
    };
    try {
      obj = JSON.parse(s);

      {
        const el = document.getElementById('texprefix');
        el.value = obj.texprefix;
      }
    } catch(ec) {
      console.warn('catch', ec.message);
    }
    return obj;
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

      const param = {
        nameEn: `a001_halfcapsule`,
      };
      const writer = new HalfCapsule();
      writer.make(param);
      const bufs = writer.makeBuffer();
      this.download(new Blob(bufs), `${param.nameEn}_${_dstr()}.pmx`);
  
      const offsets = writer.toOffsets(bufs);
      for (const chunk of offsets.chunks) {
        chunk.hex = `0x${chunk.offset.toString(16)}`;
      }
      console.log('makehalf offsets', offsets);
    });

    window.idmakephycapsule?.addEventListener('click', () => {
      this.makePhyCapsule();
    });

    window.idmake4?.addEventListener('click', () => {
      this.make4();
    });
    window.idmake5?.addEventListener('click', () => {
      this.make5();
    });
    window.idmake6?.addEventListener('click', () => {
      this.make6();
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

    //this.draw(window.canvast);
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
        this.makeApplyClip(ev.dataTransfer.files[0]);
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
 * カプセルの生成
 * phycapsule.js
 */
  makePhyCapsule() {
    const param = this.getCommonOptions();

    const writer = new PhyCapsule();
    let top = 'a'; // param.texprefix
    Object.assign(param, {
      nameEn: `${top}002_phycapsule_${param.belt}_d${param.denom.toFixed(0)}`,
    });
    writer.make(param);
    const bufs = writer.makeBuffer();
    this.download(new Blob(bufs), `${param.nameEn}.pmx`);

    const offsets = writer.toOffsets(bufs);
    for (const chunk of offsets.chunks) {
      chunk.hex = `0x${chunk.offset.toString(16)}`;
    }
    console.log('makePhyCapsule offsets', offsets);
  }

/**
 * その4の生成 シンプルカプセルの生成
 * capsule.js
 */
  make4() {
    const writer = new CapsuleBuilder();
    writer.make4();
    const bufs = writer.makeBuffer();
    this.download(new Blob(bufs), `a004_${_dstr()}.pmx`);

    const offsets = writer.toOffsets(bufs);
    for (const chunk of offsets.chunks) {
      chunk.hex = `0x${chunk.offset.toString(16)}`;
    }
    console.log('make4 offsets', offsets);
  }

/**
 * その5の生成 カプセルの生成
 * capsule.js
 */
  make5() {
    const writer = new CapsuleBuilder();
    writer.make5();
    const bufs = writer.makeBuffer();
    this.download(new Blob(bufs), `a005_${_dstr()}.pmx`);

    const offsets = writer.toOffsets(bufs);
    for (const chunk of offsets.chunks) {
      chunk.hex = `0x${chunk.offset.toString(16)}`;
    }
    console.log('make5 offsets', offsets);
  }

/**
 * その6の生成
 * capsule.js
 */
  make6() {
    const writer = new CapsuleBuilder();
    writer.make6();
    const bufs = writer.makeBuffer();
    this.download(new Blob(bufs), `a006_${_dstr()}.pmx`);

    const offsets = writer.toOffsets(bufs);
    for (const chunk of offsets.chunks) {
      chunk.hex = `0x${chunk.offset.toString(16)}`;
    }
    console.log('make6 offsets', offsets);
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
 * 緑系統色
 * @param {HTMLCanvasElement} canvas 
 */
  draw(canvas) {
    const w = 512;
    const h = 512;
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext('2d');
    const img = c.getImageData(0, 0, w, h);
    for (let y = 0; y < h; ++y) {
      for (let x = 0; x < w; ++x) {
        let r = 255;
        let g = 0;
        let b = 0;
        let a = 255;

        let rateh = 10;
        let ft = (x + w * y) * 4;
        let nx = x / (w - 1) * 2 - 1;
        let ny = y / (h - 1) * 2 - 1;
        if (y < h / 4 || y >= 3 * h / 4) {
          let ang = Math.PI;
          let hang = Math.PI * 2 * x / w;
          g = 128;
          b = Math.sin(hang * rateh) * 64 + 64;
          r = b;
          let k = (Math.abs(ny) - 0.5) * 2;
          r =   0 * k + r * (1 - k);
          g = 128 * k + g * (1 - k);
          b =   0 * k + b * (1 - k);
        } else {
          let ang = Math.PI;
          let hang = Math.PI * 2 * x / w;
          g = 128;
          b = Math.sin(hang * rateh) * 64 + 64;
          r = b;
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


