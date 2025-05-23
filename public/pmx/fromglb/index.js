/**
 * @file index.js
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/jsm/loaders/GLTFLoader.js';

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


/**
 * 初期化
 */
  init() {
    window.view.textContent = new Date().toLocaleTimeString();

    window.idmakephycapsule?.addEventListener('click', () => {
      this.makePhyCapsule();
    });

    window.idmakeik?.addEventListener('click', () => {
      const param = {
        nameEn: `a007_ikcapsule`,
      };
      const writer = new IKCapsule();
      writer.make(param);
      const bufs = writer.makeBuffer();
      this.download(new Blob(bufs), `${param.nameEn}_${_dstr()}.pmx`);
  
      const offsets = writer.toOffsets(bufs);
      for (const chunk of offsets.chunks) {
        chunk.hex = `0x${chunk.offset.toString(16)}`;
      }
      console.log('make ikcapsule offsets', offsets);            
    });

    {
      const el = window.idtoclip1;
      el?.addEventListener('click', async () => {
        const maker = new TransObjectBuilder();
        maker.make1();
        const s = maker.toString();
        console.log('s', s);
        await navigator.clipboard.writeText(s);
      });
    }

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
        this.loadFile(ev.dataTransfer.files[0]);
      });
    }

    this.initGL(window.maincanvas);
  }

/**
 * 
 * @param {HTMLCanvasElement} canvas 
 */
  initGL(canvas) {
    const renderer = new THREE.WebGLRenderer({
      canvas,
      preserveDrawingBuffer: true,
    });
    this.renderer = renderer;
    const scene = new THREE.Scene();
    this.scene = scene;

    const camera = new THREE.PerspectiveCamera(45,
      4 / 3,
      0.02, 1000);
    this.camera = camera;
    {
      camera.position.set(1, 1, 10);
    }

    const control = new OrbitControls(camera, canvas);
    this.control = control;

    {
      const axes = new THREE.AxesHelper(10);
      scene.add(axes);
    }

    this.update();
  }

  update() {
    requestAnimationFrame(() => {
      this.update();
    });

    this.control?.update();

    this.renderer?.render(this.scene, this.camera);
  }

/**
 * 
 * @param {File} file 
 */
  loadFile(file) {
    const loader = new GLTFLoader();
    const url = URL.createObjectURL(file);
    loader.load(url,
      (gltf) => {
        console.log('gltf', gltf);

        this.scene.add(gltf.scene);
        this.analyzeGLB(gltf);
      },
      (progress) => {
        console.log('progress', progress);
      },
      (err) => {
        console.warn('err', err);
      });
  }

/**
 * 
 * @param {THREE.BufferGeometry} geo 
 * @param {THREE.Material} inmtl 
 * @returns 
 */
  async geometryToPmx(geo, inmtl, param) {
    const maker = new PMX.Maker();
    { /*
      maker.vts = [];
      maker.faceIndices = [];
      maker.bones = [];
      maker.textures = [];
      maker.materials = [];
      maker.morphs = [];
      maker.frames = []; */
    }
    {
      const fip = geo.index.array;
      const fnum = fip.length / 3;
      maker.faceIndices = new Array(fnum * 3);
      for (let i = 0; i < fnum; ++i) {
        const offset = i * 3;
        maker.faceIndices[offset] = fip[offset];
        // 逆回し?
        maker.faceIndices[offset+1] = fip[offset+2];
        maker.faceIndices[offset+2] = fip[offset+1];
      }
    }
    {
      const boneIndex = 1;
      const pa = geo.attributes.position;
      const na = geo.attributes.normal;
      const vnum = pa.array.length / 3;
      for (let i = 0; i < vnum; ++i) {
        const vt = new PMX.Vertex();
        maker.vts.push(vt);

        vt.deform = PMX.Vertex.BDEF1;
        vt.weights = [1, 0, 0, 0];
        vt.joints = [boneIndex, 0, 0, 0];
        vt.p = [pa.getX(i), pa.getY(i), - pa.getZ(i)];
        vt.n = [na.getX(i), na.getY(i), - na.getZ(i)];
      }
    }
    {
      {
        const b = new PMX.Bone();
        b.nameJa = '全ての親';
        b.nameEn = 'root';
        b.bits = PMX.Bone.BIT_MOVE
          | PMX.Bone.BIT_ROT
          | PMX.Bone.BIT_VISIBLE
          | PMX.Bone.BIT_CONTROL;
        maker.bones.push(b);
      }
      {
        const b = new PMX.Bone();
        b.nameJa = 'センター';
        b.nameEn = 'center';
        b.parent = 0;
        b.bits = PMX.Bone.BIT_MOVE
          | PMX.Bone.BIT_ROT
          | PMX.Bone.BIT_VISIBLE
          | PMX.Bone.BIT_CONTROL;
        maker.bones.push(b);
      }
    }
    {
      maker.textures.push(param.texpath || 'tex/t000.png');
    }
    {
      const m = new PMX.Material();
      m.nameEn = 'm000';
      m.nameJa = m.nameEn;
      m.edgeColor = [0, 0, 0, 1];
      m.texIndex = 0;

      maker.materials.push(m);

      const fip = geo.index.array;
      const fnum = fip.length / 3;
      for (let i = 0; i < fnum; ++i) {
        const offset = i * 3;
        m.faces.push([
          fip[offset],
        // 逆回し?
          fip[offset+2],
          fip[offset+1],
        ]);
      }

    }
    {
      {
        const f = new PMX.Frame();
        f.nameEn = 'Root';
        f.nameJa = f.nameEn;
        f.specialFlag = true;
        f.bones.push(0, 1);
        maker.frames.push(f);
      }
      {
        const f = new PMX.Frame();
        f.nameEn = 'Exp';
        f.nameJa = '表情';
        f.specialFlag = true;
        maker.frames.push(f);
      }
    }
    {
      maker.head.nameEn = 'corge';
      maker.head.commentEn = 'grault';
      maker.head.nameJa = param.nameJa ?? maker.head.nameEn;
      maker.head.commentJa = maker.head.commentEn;
    }

    const ret = {
      textures: [],
    };
    {
/**
 * @type {ImageBitmap}
 */
      const bitmap = inmtl.map?.source?.data;
      const blob = await new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const c = canvas.getContext('2d');
        c.drawImage(bitmap, 0, 0);
        canvas.toBlob(blob => {
          resolve(blob);
        }, 'image/png');
      });
      ret.textures.push(blob);
    }
    console.log('ret', ret);
    {
      const abs = maker.makeBuffer();
      ret.pmx = new Blob(abs);
    }

    return ret;
  }

  analyzeGLB(gltf) {
    let _count = 0;
    gltf.scene.traverse(async (obj) => {
      if (!obj.type.toLowerCase().includes('mesh')) {
        return;
      }
      console.log('obj', obj.type, obj.name, 'traverse');
      console.log('geometry', obj.geometry);

      const name = `t${_pad(_count, 3)}.png`;
      const param = { texpath: `${name}`,
        nameJa: `a${_pad(_count, 3)}`,
      };
      _count += 1;

      const result = await this.geometryToPmx(
        obj.geometry,
        obj.material,
        param);
      {
        if (result.pmx) {
          console.log('download', result.pmx.size);
          this.download(result.pmx, `${param.nameJa}.pmx`);
          for (const t of result.textures) {
            this.download(t, name);
          }
        }
      }
      return true;
    });
  }

/**
 * カプセルの生成
 * phycapsule.js
 */
  makePhyCapsule() {
    const writer = new PhyCapsule();
    const obj = {
      nameEn: `a002_phycapsule`,
    };
    writer.make(obj);
    const bufs = writer.makeBuffer();
    this.download(new Blob(bufs), `a002_phycapsule${_dstr()}.pmx`);

    const offsets = writer.toOffsets(bufs);
    for (const chunk of offsets.chunks) {
      chunk.hex = `0x${chunk.offset.toString(16)}`;
    }
    console.log('makePhyCapsule offsets', offsets);
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
misc.init();

