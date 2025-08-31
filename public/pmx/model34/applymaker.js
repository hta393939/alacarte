// clipboard にセットするための実行関数を持つ

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

/**
 * 線形補間
 * @param {[number,number,number]} a 
 * @param {[number,number,number]} b 
 * @param {number} t bの重さ。0だとa、1だとb
 */
const _lerp = (a, b, t) => {
  if (t <= 0) {
    return [...a];
  }
  if (t >= 1) {
    return [...b];
  }
  return [
    a[0] * (1 - t) + b[0] * t,
    a[1] * (1 - t) + b[1] * t,
    a[2] * (1 - t) + b[2] * t,
  ];
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
  analyzeFileRoss(parser, param) {
    /**
     * 物理変形
     * @type {boolean}
     */
    const _usePhy = document.getElementById('usephy')?.checked;
    const _useChain = document.getElementById('usechain')?.checked;
    const _useMorph = document.getElementById('usemorph')?.checked;
    const _useAdd = document.getElementById('useadd')?.checked;
    console.log('〇 applymaker.js analyzeFileRoss, 物理使用', _usePhy, _useChain, _useMorph, _useAdd);
    /**
     * gui group(1-origin)
     */
    const RIGID_DEFAULT_GROUP = 3;
    /**
     * gui group(1-origin) #4はだめ
     */
    const RIGID_NEXT_GROUP = 6;

    const firstj = 7;
    const secondj = 5;
    const thirdj = 3;

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
    /** 右 */
    const R = 0;
    /** 左 */
    const L = 1;
    /** 右左のプリフィクス */
    const lrname = ['r_', 'l_'];
    /**
     * 1-origin
     */
    const rigidGroups = [RIGID_DEFAULT_GROUP, RIGID_NEXT_GROUP];

    /** 最小が有効扱いするので大きい値 */
    const NA = 999999;

    let rmin = 99999;
    let lmin = 99999;

    for (let i = 0; i < mtl._faceIndexNum; ++i) {
      const index = _ficount + i;
      const vtxIndex = parser.faceIndices[index];
      /** 頂点1個 */
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

    /** 各0～13段のインデックスに分離する */
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
        `${_useAdd ? '追加剛体有り': ''}`,
      ];
      modelInfo.commentJa += comments.join('\r\n');

      let typeAdd = '';
      if (_usePhy) {
        if (_useChain) {
          typeAdd = 'e';
        } else {
          typeAdd = 'd';
          if (_useAdd) {
            typeAdd = 'g';
          }
        }
      }
      modelInfo.modelJa += typeAdd;
    }

    // リングごとに算出する
    /** 頂点トランスレートの場合 */
    const adjustvts = [];
    /**
     * モーフの場合
     * @type {PMX.Morph[]}
     */
    const morphs = [];

    const _node = new PMX.PMXNode();
    _node.nameJa = _usePhy ? '物理変形' : 'ボーン変形';
    const items = [];
    /** ボーン配列 */
    const bones = [];

    /** 既存表情への追加 */
    const frames = [];

    /** @type {PMX.Rigid[]} */
    const rigids = [];
    /** @type {PMX.Joint[]} */
    const joints = [];

    const _shapes = [
      { rr: 1, delta: 0.00 }, // 0
      { rr: 0.4, delta: -0.01 }, // 1
      { rr: 0.8, delta: 0.02 }, // 2
      { rr: 1.0, delta: 0.02 + 0.01 }, // 3
      { rr: 1.1, delta: 0.04 + 0.01 }, // 4
      { rr: 1.08, delta: 0.05 + 0.01 }, // 5 NOTE: 長くした
      { rr: 1.05, delta: 0.05 + 0.01 }, // 6 NOTE: 長くした
      { rr: 1, delta: 0.03 }, // 7 基準
      { rr: 1, delta: 0.01 }, // 8
      { rr: 1, delta: 0.01 }, // 9
      { rr: 1, delta: 0.02 }, // 10
      { rr: 1, delta: 0.02 }, // 11
      { rr: 1, delta: 0.02 }, // 12
      { rr: 1, delta: 0.02 }, // 13          
    ];

/* 計算後位置 // #5, #6 を 0.04 伸ばした後
l_chest7 [1.309, 14.648, -1.857];
l_chest5 [1.452, 14.790, -2.127]; // #5, #6 を 0.04 伸ばした後
l_chest3 [1.512, 14.850, -2.241];
l_chest1 [1.530, 14.868, -2.276];

body
l_chest7 [1.393, 14.734, -2.017];

    const calced7b = [1.393, 14.734, -2.017];
    //const calced7 = [];
    const calced5 = [1.452, 14.790, -2.127];
    const calced1 = [1.530, 14.868, -2.276]; */

/* #3, #4, #5 を 0.02 長くした
    const calced7b = [1.393, 14.734, -2.017];
    const calced7 = [1.309, 14.648, -1.857];
    const calced5 = [1.435, 14.773, -2.095];
    const cacced3 = [1.495, 14.833, -2.209];
    const calced1 = [1.522, 14.859, -2.260]; */

    /* #6, #5, #4, #3 を 0.01 長くした */
    const calced7b = [1.393, 14.734, -2.017];
    const calced7 = [1.309, 14.648, -1.857];
    const calced5 = [1.439, 14.777, -2.103];
    const calced3 = [1.491, 14.828, -2.201];
    const calced1 = [1.514, 14.851, -2.244];

    let dist51 = _dist(calced5, calced1);
    //dist51 += _shapes[4].delta + _shapes[3].delta + _shapes[2].delta;
    console.log('dist51', dist51);


    const additiveMorphs = [];
    for (let i = 0; i < 2; ++i) {
      const isRight = (i === R);

      const morph = new PMX.Morph();
      additiveMorphs.push(morph);
      morph.nameEn = `${lrname[i]}chest`;
      morph.nameJa = morph.nameEn;
      morph.panel = PMX.Morph.PANEL_ETC;
      morph.type = PMX.Morph.TYPE_VERTEX;

      /** 直前の親で更新していくボーン名 */
      let _preBoneName = (isRight ? '右' : '左') + '胸';
      /** 親ボーン保持用 */
      let _parentBoneName = '' + _preBoneName;
      /** 更新していく物理名 */
      let _preRigidName = '' + _preBoneName;
      /**
       * 頂点へのウェイト影響ボーン．
       * 一番最初は局所ルート
       */
      let _effectBoneName = '' + _preBoneName;
      /** #7ボーン名 */
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
        /** 根本に近い方の重み */
        let vertexWeight = 1;

        // ここまでのオフセットを足す
        /**
         * このリングの重心
         * @type {V3}
         */
        const center = new V3(...result.avg);
        /** ボーン */
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
        if (_useAdd && j === secondj) {
          bone._parentName = `${lrname[i]}chest7`;
        }

        /** フレーム内アイテム */
        const item = new PMX.NodeItem();
        item._parentName = _node.nameJa;
        item._itemName = bone.nameJa;
        items.push(item);
        /** 物理剛体 */
        const rigid = new PMX.Rigid();
        rigid.nameJa = bone.nameJa;
        rigid.nameEn = bone.nameEn;
        rigid._boneName = bone.nameJa;
        rigid.type = _usePhy ? PMX.Rigid.TYPE_DYNAMIC_POS : PMX.Rigid.TYPE_STATIC;
        rigid.shape = PMX.Rigid.SHAPE_CAPSULE;
        rigid.p = [...bone.p]; // 剛体位置はここで終わり
        /** 計算上の半径 */
        //const rr = (newradius >= 0) ? newradius : result.radius;
        //rigid.size = [rr, capHeight, rr];
        rigid.size = [0.11, 0.29, 1];
        //rigid.size = [0.11, 0.29, 1]; // キープ 1つのとき元のうまくいくサイズ
        if (_useAdd) {
          const halfDist = _dist(calced5, calced7b);
          rigid.size = [0.11, halfDist * 2, 1];
          if (j === secondj) {
            rigid.size = [0.11, dist51 - 0.11, 1];
          }
        }

        rigid.setUIGroup(rigidGroups[i]);
        rigid.setUINots(1, 2,
          rigidGroups[i], // 自分側には当たらない(逆には当たる)
          13, 14, 15, 16);

        rigid.moveDamping = 0;
        rigid.rotDamping = 1; // 全減衰でよい。joint ばねで戻す
        //rigid.mass = 0.002;
        rigid.mass = 0.02; // 質量0.2 ばね0.5 だと弱いかも
        rigid.friction = 100;
        rigid.pong = 0;

        /** ジョイント */
        const joint = new PMX.Joint();
        joint.nameEn = `j_${i}_${j}`;
        joint.nameJa = joint.nameEn;
        joint.p = [...bone.p]; // NOTE: 書き換えた
        joint._rigidName = [_preRigidName, rigid.nameJa];
        if (j === secondj) {
          joint._rigidName = [_sevenBoneName, rigid.nameJa];
        }
        joint.lockMove();
        joint.lockRot();
        {
          //if (j >= 1 && j <= 7) {
          if (j === firstj) { // 重要ボーン #7
            /** 移動範囲 */
            const dp = 0;
            /** 回転範囲 */
            const dr = (j === firstj) ? /*90*/ 45 : 45;
            joint.moveUpper = [dp, dp, dp];
            joint.moveLower = [-dp, -dp, -dp];
            joint.rotUpper = [_deg2rad(dr), _deg2rad(dr), _deg2rad(dr * 1)];
            joint.rotLower = [_deg2rad(-dr), _deg2rad(-dr), _deg2rad(-dr * 1)];
            joint.springMove = [0, 0, 0];
            //joint.springRot = [0.5, 0.5, 0.5];
            joint.springRot = [2.5, 2.5, 2.5]; // NOTE: 戻る値
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
              if (false) { // NOTE: true にすると剛体半分にする
                //const rigidRate = rate - (rigid.size[0] + rigid.size[1]) * 0.5;
                //const rigidRate = - (rigid.size[0] + rigid.size[1]) * 0.5;
                const rigidRate = 0.0;
                rigid.size[0] *= 0.5;
                rigid.size[1] *= 0.5;
                rigid.size[2] *= 0.5;
                const halfP = new V3(
                  0.42 * (bone.p[0] >= 0 ? 1 : -1),
                  0.43,
                 -0.80,
                );
                halfP.scale(rigidRate).add(new V3(...rigid.p));                
                rigid.p = halfP.asArray();
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

          if (_useAdd && (j === secondj)) { // 2個め #5
            /** 移動範囲 */
            const dp = 0;
            /** 回転範囲 */
            const dr = 90;
            joint.moveUpper = [dp, dp, dp];
            joint.moveLower = [-dp, -dp, -dp];
            joint.rotUpper = [_deg2rad(dr), _deg2rad(dr), _deg2rad(dr * 1)];
            joint.rotLower = [_deg2rad(-dr), _deg2rad(-dr), _deg2rad(-dr * 1)];
            joint.springMove = [0, 0, 0];
            joint.springRot = [2.5, 2.5, 2.5]; // NOTE: 戻す強さ
            // 予め測定した方向ベクトル NOTE: #5 はこのままでいいのか??
            const constDir = [0.42, 0.43, -0.8];
            rigid.rot = [
              - Math.acos(constDir[1]),
              //_deg2rad(30 * ((rigid.p[0] >= 0) ? -1 : 1)),
              Math.atan2(constDir[0], -constDir[2]) * ((rigid.p[0] >= 0) ? -1 : 1),
              0];
            joint.rot = [...rigid.rot]; // [ ] 未確認

            { // 剛体の位置は中心を指定するので少し先に行く
              let rate = rigid.size[1] * 0.5;
              const adjust = new V3(
                 0.42 * (bone.p[0] >= 0 ? 1 : -1),
                 0.43,
                -0.80,
              );
              adjust.scale(rate).add(new V3(...bone.p));
              rigid.p = adjust.asArray();
              console.log(`〇 2つめ`);
            }

            if (_usePhy) {
              rigids.push(rigid);
              joints.push(joint);
            }
          }

          //// 頂点ウエイトなどの計算や更新
          if (j >= 8) { // より根本ボーンに近い方(j は逆進)       
            //_effectBoneName = bone.nameJa;
            _effectBoneName = _preBoneName;
            // 13, 12～7
            vertexWeight = (j - 7) / (12 - 7);
            vertexWeight = Math.max(0, Math.min(1, vertexWeight));
          } else if (j === firstj) { // #7
            _effectBoneName = bone.nameJa;

            // 格納後
            _parentBoneName = bone.nameJa;
          } else if (j <= 6) { // より先端に近い方 endボーン

            if (thirdj < j && j < firstj) { // #3 < j < #7
              vertexWeight = (j - thirdj) / (firstj - thirdj);
              vertexWeight = Math.max(0, Math.min(1, vertexWeight));
              // #3と#7で逆なので逆転させる
              vertexWeight = 1 - vertexWeight;

              // このターンの後半で使用する
              //_effectBoneName = bone.nameJa;
              _effectBoneName = `${lrname[i]}chest${thirdj}`;

              // 格納後 次のボーンに使用する
              _parentBoneName = bone.nameJa;

              if (j !== secondj) { // #5以外                
                if (_usePhy) {
                  bone.bits |= PMX.Bone.BIT_AFTERPHY;
                }
              }

            } else {
              //// 通常
              _effectBoneName = bone.nameJa;
              // 格納後
              _parentBoneName = bone.nameJa;
              
              if (_usePhy) {
                bone.bits |= PMX.Bone.BIT_AFTERPHY;
              }
            }

          }
        }

        for (const index of setset[i][j]) { // 頂点
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
            vtx._boneName = [
              _effectBoneName,
              _sevenBoneName,
              '',
              '',
            ];
            vtx.weights = [vertexWeight, 1 - vertexWeight, 0, 0];
          }
          { // SDEF 時のみ参照される。今は無効
            let index7 = (ringNum - 1 - 7) + i * ringNum;
            let index3 = (ringNum - 1 - 3) + i * ringNum;
            if (index3 < bones.length) {
              vtx.r0 = [...(bones[index7].p)]; // #7
              vtx.r1 = [...(bones[index3].p)]; // #3
              vtx.c  = _lerp(vtx.r0, vtx.r1, vertexWeight);
            }
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


    if (_usePhy) { // 物理属性補正
      for (const rigid of parser.rigids) {
        if (rigid.nameJa === '右胸'
          || rigid.nameJa === '左胸') {
          rigid._boneName = rigid.nameJa;
          rigid.setUINots(1, 2,
            3, 4,
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

    { // モーフ追加
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

  /**
   * 足してみる．
   * フレームに追加するには??
   * @param {*} parser 
   */
  analyzeNormal(parser) {
    const morphs = [];
    const additiveMorphs = [];
    const nodeItems = [];

    // 材質で絞るためのカウント
    let _ficount = 0;
    let mtl = null;
    for (let i = 0; i < parser.materials.length; ++i) {
      mtl = parser.materials[i];
      if (mtl.nameJa === '\u30d1\u30f3\u30c4') {
    //            if (mtlIndex === i) {
        console.log('_ficount', _ficount);
        break;
      }
      _ficount += mtl._faceIndexNum;
      console.log(mtl._faceIndexNum / 3);
    }

    //const indices = new Map();
    for (let i = 0; i < mtl._faceIndexNum; ++i) {
      const index = _ficount + i;
      const vtxIndex = parser.faceIndices[index];

      console.log('vtxIndex', vtxIndex);

      /**
       * 最小が有効扱いするので大きい値
       */
      //const NA = 999999;
      /**
       * 頂点1個
       * @type {PMX.Vertex}
       */
      const vtx = parser.vts[vtxIndex];
      vtx._analyze = {
        target: true,
        //ring: NA,
        lr: Math.sign(vtx.p[0]),
      };

    }

    for (let i = 0; i <= 2; ++i) {
      const morph = new PMX.Morph();
      additiveMorphs.push(morph);
      morph.nameEn = `pn${i}`;
      morph.nameJa = morph.nameEn;
      morph.panel = PMX.Morph.PANEL_ETC;
      morph.type = PMX.Morph.TYPE_VERTEX;

      const item = new PMX.NodeItem();
      nodeItems.push(item);
      item._parentName = '表情';
      item.type = PMX.NodeItem.TYPE_EXPRESSION;
      item._itemName = morph.nameJa;
    }

    const ys = [];

    const vtxNum = parser.vts.length;
    for (let i = 0; i < vtxNum; ++i) {
      const vtx = parser.vts[i];
      if (!vtx._analyze?.target) {
        continue;
      }

      let index = i;
      const vm = new PMX.VertexMorph();
      // 頂点インデックス
      vm.target = index;

      vm.offset = [0, 0, 0];
      let [x, y, z] = vtx.p;
      console.log('x, y, z', x.toFixed(2), y.toFixed(2), z.toFixed(2));
      // 12.5 無さそう
      //const ythr2 = 12.08; // ほぼok
      //const ythr2 = 12.05;
      //const ythr2 = 12.0;
      const ythr2 = 11.9; // OK

      //const ythr = 10.04; // なぜか裏返る
      const ythr = 10;

      let morph = null;

      //let z = vtx.p[2];
      //const zabs = Math.abs(z);
      if (y >= ythr) {
        if (y >= ythr2) { // 横
          morph = additiveMorphs[0];
          vm.offset = [Math.sign(x) * 0.5, 0.5, 0];
          //vm.offset = [Math.sign(x) * 0.5, 0, 0]; // 横広
        } else { // 厚み
          morph = additiveMorphs[1];
          vm.offset = [0, 0, Math.sign(z) * 0.5];
        }
        if (x > 0) {
          ys.push(y);
        }
      } else { // 下
        morph = additiveMorphs[2];
        y -= ythr;
        //const dir = new V3(0, y, z);
        //vm.offset = dir.normalize().scale(0.5).asArray();

        const dir = new V3(0, y, 0);
        vm.offset = dir.normalize().scale(1.25).asArray();
      }

      vm._parentName = morph?.nameJa ?? '';
      // 一番最後に足すためのインデックス
      vm._index = morph?.vertexMorphs?.length || 0;
      {
        vm._p = [x, y, z];
      }
      morph?.vertexMorphs?.push(vm);
    }
    morphs.push(...additiveMorphs);

    ys.sort((a, b) => b - a);
    console.log('ys', ...ys.map(v => v.toFixed(2)));
    {
      for (const m of additiveMorphs) {
        m.vertexMorphs.sort((a, b) => b._p[1] - a._p[1]);
      }
      console.log('additive', additiveMorphs);
    }

    // 行返す
    const lines = [];
    for (const mr of morphs) {
      lines.push(...mr.toLines());
    }
    for (const item of nodeItems) {
      lines.push(item.toCSV());
    }
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
