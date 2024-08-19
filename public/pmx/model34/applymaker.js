/**
 * @file applymaker.js
 */
// clipboard にセットするための実行関数を持つ
// 2024/2/12 14:23 分岐して使用中

(function(_global) {

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


class ApplyMaker {
  constructor() {
  }

  /**
   * 元ファイルを解析した後にクリップボードへ変更点を送信する関数
   * 2024/1/6 17:49 keep
   * @param {File} file 
   */
  async parseFile(file) {
    const ab = await file.arrayBuffer();
    const parser = new PMX.Maker();
    this.parser = parser;
    parser.parse(ab);

    const result = this.analyzeFileRoss(parser);

    result.push('');
    let str = result.join('\n');
    await navigator.clipboard.writeText(str);
  }

  /**
   * API. 位置ベース。クリップボード用。
   * @param {PMX.Parser} parser 
   * @returns {string[]} 行ごとに返す
   */
  analyzeFileRoss(parser) {
    /**
     * 物理変形
     * @type {boolean}
     */
    const _usePhy = document.getElementById('usephy')?.checked;
    const _useChain = document.getElementById('usechain')?.checked;
    const _useMorph = document.getElementById('usemorph')?.checked;
    console.log('applymaker.js analyzeFileRoss, 物理使用', _usePhy, _useChain, _useMorph);
    /**
     * gui group(1-origin)
     */
    const RIGID_DEFAULT_GROUP = 3;

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
    //const lrname = ['right', 'left'];
    const lrname = ['r_', 'l_'];
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

    const modelInfo = parser.modelInfo;
    {
      const comments = [
        '',
        `${_usePhy ? '物理使用' : '物理無し'}`,
        `${'内中心'}`,
      ];
      modelInfo.commentJa += comments.join('\r\n');
      modelInfo.modelJa += `${_usePhy ? (_useChain ? 'e' : 'd') : ''}`;
    }

// リングごとに算出する
/**
 * 頂点トランスレートの場合
 */
    const adjustvts = [];
/**
 * モーフの場合
 * @type {PMX.Morph[]}
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
      { rr: 1.1, delta: 0.04 }, // 4
      { rr: 1.08, delta: 0.05 }, // 5
      { rr: 1.05, delta: 0.05 }, // 6
      { rr: 1, delta: 0.03 }, // 7 基準
      { rr: 1, delta: 0.01 }, // 8
      { rr: 1, delta: 0.01 }, // 9
      { rr: 1, delta: 0.02 }, // 10
      { rr: 1, delta: 0.02 }, // 11
      { rr: 1, delta: 0.02 }, // 12
      { rr: 1, delta: 0.02 }, // 13          
    ];
/*
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
    ]; */

    const additiveMorphs = [];
    for (let i = 0; i < 2; ++i) {
      const morph = new PMX.Morph();
      additiveMorphs.push(morph);
      morph.nameEn = `${lrname[i]}chest`;
      morph.nameJa = morph.nameEn;
      morph.panel = PMX.Morph.PANEL_ETC;
      morph.type = PMX.Morph.TYPE_VERTEX;

/**
 * 直前の親で更新していくボーン名
 */
      let _preBoneName = ((i === R) ? '右' : '左') + '胸';
/**
 * 親ボーン保持用
 */
      let _parentBoneName = '' + _preBoneName;
/**
 * 更新していく物理名
 */
      let _preRigidName = '' + _preBoneName;
/**
 * ウェイト影響ボーン．
 * 一番最初は局所ルート
 */
      let _effectBoneName = '' + _preBoneName;

      const _sevenBoneName = `${lrname[i]}chest${7}`;

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
/**
 * 根本に近い方の重み
 */
        let vertexWeight = 1;

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
        ;
        if (!_usePhy) { // TODO: 物理無しの場合は追加ボーンはすべて物理後
          bone.bits |= PMX.Bone.BIT_AFTERPHY;
        }

        bone.xLocalVector = new V3(...result.normal).scale(-1).asArray();
        const basis = Util.MakeBasisLH(...bone.xLocalVector);
        bone.zLocalVector = new V3(...basis[0]).scale(-1).asArray();
        // 親ボーン
        bone._parentName = _parentBoneName;
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
        rigid.type = _usePhy ? PMX.Rigid.TYPE_DYNAMIC_POS : PMX.Rigid.TYPE_STATIC;
        //rigid.type = _usePhy ? PMX.Rigid.TYPE_DYNAMIC : PMX.Rigid.TYPE_STATIC;
        //rigid.shape = PMX.Rigid.SHAPE_SPHERE;
        rigid.shape = PMX.Rigid.SHAPE_CAPSULE;
        rigid.p = [...bone.p]; // 剛体位置はここで終わり
        /**
         * 半径
         */
        const rr = (newradius >= 0) ? newradius : result.radius;
        let capHeight = rr;
        //rigid.size = [rr, capHeight, rr];
        rigid.size = [0.11, 0.29, 1];
        //rigid.size = [0.11, 0.29, 1]; // キープ

        rigid.setUIGroup(RIGID_DEFAULT_GROUP);
        rigid.setUINots(1, 2, 3,
          13, 14, 15, 16);
        rigid.moveDamping = 0;
        rigid.rotDamping = 1; // 全減衰でよい。joint ばねで戻す
        //rigid.mass = 0.002;
        rigid.mass = 0.02; // 質量0.2 ばね0.5 だと弱いかも
        rigid.friction = 100;
        rigid.pong = 0;

/**
 * ジョイント
 */
        const joint = new PMX.Joint();
        joint.nameEn = `j_${i}_${j}`;
        joint.nameJa = joint.nameEn;
        joint.p = [...rigid.p];
        joint._rigidName = [_preRigidName, rigid.nameJa];
        //_preRigidName = rigid.nameJa;
        joint.lockMove();
        joint.lockRot();
        {
          //if (j >= 1 && j <= 7) {
          if (j === 7) { // 重要ボーン
            /**
             * 移動範囲
             */
            const dp = 0;
            /**
             * 回転範囲
             */
            const dr = (j === 7) ? /*90*/ 45 : 45;
            joint.moveUpper = [dp, dp, dp];
            joint.moveLower = [-dp, -dp, -dp];
            joint.rotUpper = [_deg2rad(dr), _deg2rad(dr), _deg2rad(dr * 1)];
            joint.rotLower = [_deg2rad(-dr), _deg2rad(-dr), _deg2rad(-dr * 1)];
            joint.springMove = [0, 0, 0];
            joint.springRot = [0.5, 0.5, 0.5];
            // 予め測定した方向ベクトル
            const constDir = [0.42, 0.43, -0.8];
            rigid.rot = [
              - Math.acos(constDir[1]),
              //_deg2rad(30 * ((rigid.p[0] >= 0) ? -1 : 1)),
              Math.atan2(constDir[0], -constDir[2]) * ((rigid.p[0] >= 0) ? -1 : 1),
              0];
            joint.rot = [...rigid.rot]; // [ ] 未確認

            { // 内側に引き込む
              let rate = -0.2; // これより少なくて良さそう
              if (true) { // NOTE: 半分の場合
                rate += - (rigid.size[0] + rigid.size[1]) * 0.5;
                rigid.size[0] *= 0.5;
                rigid.size[1] *= 0.5;
                rigid.size[2] *= 0.5;
              }

              const adjust = new V3(
                 0.42 * (bone.p[0] >= 0 ? 1 : -1),
                 0.43,
                -0.80,
              );
              adjust.scale(rate).add(new V3(...bone.p));
              const p = adjust.asArray();

              bone.p = p;
              joint.p = p;
              console.log(`${j} 物理サイズ`, [...rigid.size]);
            }

            if (_usePhy) {
              rigids.push(rigid);
              joints.push(joint);
            }
          }

          if (j >= 8) { // より根本ボーンに近い方(j は逆進)       
            //_effectBoneName = bone.nameJa;
            _effectBoneName = _preBoneName;
            // 13, 12～7
            vertexWeight = (j - 7) / (12 - 7);
            vertexWeight = Math.max(0, Math.min(1, vertexWeight));
          } else if (j === 7) {
            _effectBoneName = bone.nameJa;

            // 格納後
            _parentBoneName = bone.nameJa;
          } else if (j <= 6) { // より先端に近い方 endボーン
            _effectBoneName = bone.nameJa;
            // 格納後
            _parentBoneName = bone.nameJa;
            
            if (_usePhy) {
              bone.bits |= PMX.Bone.BIT_AFTERPHY;
            }
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
          if (true) { // 戻すモーフ
            vm.offset[0] *= -1;
            vm.offset[1] *= -1;
            vm.offset[2] *= -1;
          }

          vtx.p = new V3(...vtx.p).add(adjust).asArray();
// 頂点変形を足す
          {
            vtx.deformType = PMX.Vertex.DEFORM_BDEF2;
            vtx._boneName = [_effectBoneName, _sevenBoneName, '', ''];
            vtx.weights = [vertexWeight, 1 - vertexWeight, 0, 0];
          }
          adjustvts.push(vtx);
        }
        // オフセットに法線とちょこっとを足す
        const delta = _shapes[j].delta;
        offsets[0] += - result.normal[0] * delta;
        offsets[1] += - result.normal[1] * delta;
        offsets[2] += - result.normal[2] * delta;

        _preBoneName = bone.nameJa;
      }
    }

    if (_usePhy) { // 補正
      for (const rigid of parser.rigids) {
        if (rigid.nameJa === '右胸'
          || rigid.nameJa === '左胸') {
          rigid._boneName = rigid.nameJa;
          rigid.setUINots(1, 2, 3, 4,
            13, 14, 15, 16
          );
          if (_useChain) {
            // Do nothing.
          } else {
            rigid.type = PMX.Rigid.TYPE_STATIC;
          }
          rigids.push(rigid);
        }
      }
    }

    {
      const mr = new PMX.Morph();
      morphs.push(mr);
      mr.nameEn = `p`;
      mr.nameJa = mr.nameEn;
      mr.panel = PMX.Morph.PANEL_ETC;
      mr.type = PMX.Morph.TYPE_MATERIAL;
      morphs.push(mr);

      const mmr = new PMX.MaterialMorph();
      mmr.setValue(0);
      mmr._index = 0;
      mmr._parentName = 'p';
      mmr._materialName = '\u30d1\u30f3\u30c4';
      mr.materialMorphs.push(mmr);
    }

    if (_useMorph) {
      // TODO: フレームへの追加は未実装
      morphs.push(...additiveMorphs);
    }

// 行返す
    const lines = [];
    if (false) { // 変形の場合(不使用)
      for (const morph of morphs) {
        lines.push(...morph.toLines());
      }
    } else { // 上書き更新と追加の場合

      {
        console.log('%cmodelInfo', 'color:green;font-weight:bold', modelInfo);
        lines.push(modelInfo.toCSV());
      }

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

      for (const mr of morphs) {
        lines.push(...mr.toLines());
      }
    }
    console.log('終わり', setset);
    return lines;
  }

}


if (typeof exports !== 'undefined') {
  if (typeof module !== 'undefined' && module.exports) {
    exports = module.exports = ApplyMaker;
  }
  exports.ApplyMaker = ApplyMaker;
} else {
  _global.ApplyMaker = ApplyMaker;
}

})(globalThis);
