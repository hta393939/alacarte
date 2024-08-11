/**
 * @file halfcapsule.js
 */
// make() で生成
// sdef

(function(_global) {

const _lerp = (a, b, t) => {
  return a + (b - a) * t;
};

const _rad = (deg) => {
  return deg * Math.PI / 180;
};

class HalfCapsule extends PMX.Maker {
  constructor() {
    super();
  }

/**
 * 破壊
 * @param {number[]} vs 
 */
  normalize(vs) {
    let sum = vs.reduce((p, c) => p + c * c, 0);
    if (sum === 0) {
      return vs;
    }
    const k = 1 / Math.sqrt(sum);
    for (let i = 0; i < vs.length; ++i) {
      vs[i] *= k;
    }
    return vs;
  }

/**
 * 
 * @param {number[]} vs 
 * @param {number} deg 
 */
  rotate(vs, deg) {
    const ang = deg * Math.PI / 180;
    const cs = Math.cos(ang);
    const sn = Math.sin(ang);
    let x = vs[0] * cs - vs[1] * sn;
    let y = vs[0] * sn + vs[1] * cs;
    vs[0] = x;
    vs[1] = y;
    return vs;
  }

/**
 * SDEF してみたい。
 */
  make(param) {
    const d = new Date();
    const util = new Util();
    util.srand(1);
/**
 * 最終位置とサイズへの倍率
 */
    const scale = 1.0;
 
    this.debug = 1;

    this.head.nameEn = param.nameEn;
    this.head.nameJa = this.head.nameEn;
    this.head.commentEn = `${d.toLocaleString()} HalfCapsule.make`;
    this.head.commentJa = this.head.commentEn;

    let div = 16;

/**
 * すべての親 0 メッシュ無し
 * 操作中心 1 メッシュ無し
 */
/**
 * センター 2
 */
    const centerBoneIndex = 2;

/**
 * 2x2 を丸めたイメージで
 * 2 * PI * r = 2 * 2
 */
    const capsuleR = 4 / (2 * Math.PI);
    {
      for (let i = 0; i <= div; ++i) {
        for (let j = 0; j <= div / 2; ++j) {
          const v = new PMX.Vertex();

          const rr = capsuleR;
          let hang = Math.PI * 2 * j / div;
          const cs = Math.cos(hang);
          const sn = Math.sin(hang);
          let x = -cs * rr;
          let z = sn * rr;
          let y = 1 - i * 2 / div;
          let amp = 0.006;
          amp = 0;
          x += amp * (util.rand() / 16384 - 1);
          y += amp * (util.rand() / 16384 - 1);
          z += amp * (util.rand() / 16384 - 1);

          v.n = this.normalize([-x, 0, -z]);
          v.p = [x * scale, y * scale, z * scale];
          v.uv = [
            (j / (div/2)),
            1 - (i / div),
          ];
          v.deformType = PMX.Vertex.DEFORM_BDEF1;
          v.joints = [centerBoneIndex, 0, 0, 0];
          v.weights = [1, 0, 0, 0];
          this.vts.push(v);
        }

      }
    }

    {
      let name = param.texturePath;
      this.textures.push(name);
    }

    for (let i = 0; i < 1; ++i) { // 材質 #1
      const m = new PMX.Material();
      m._index = i;
      m.nameJa = `材質00${i}`;
      m.nameEn = `mtl00${i}`;
      m.texIndex = 0;
      m.diffuse = [1, 1, 1, 1];
      m.specular = [0.2, 0.2, 0.2];
      m.specular = [0, 0, 0];
      m.specPower = 0.5;
      m.ambient = [0.7, 0.7, 0.7];
      m.edgeColor = [156/255, 130/255, 48/255, 1];
      let bits = 0
        //PMX.Material.BIT_GROUND
        | PMX.Material.BIT_TOMAP
        | PMX.Material.BIT_SELFSHADOW
      m.bitFlag = bits;
      //m.sphereMode = 2; // 加算
      //m.sphereIndex = 1;
      m.sharetoonflag = 0;
      m.sharetoonindex = -1;
      {
        for (let k = 0; k < div; ++k) {
          for (let j = 0; j < div / 2; ++j) {
            let v0 = j + (div / 2 + 1) * k;
            let v1 = v0 + 1;
            let v2 = v0 + (div / 2 + 1);
            let v3 = v2 + 1;
            m.faces.push([v0, v1, v2]);
            m.faces.push([v1, v3, v2]);
          }
        }
      }
      this.materials.push(m);
    }

    for (let i = 0; i < 3; ++i) {
/**
  * ボーン
  */
      let b = new PMX.Bone();

      let bits = PMX.Bone.BIT_MOVE | PMX.Bone.BIT_ROT
        | PMX.Bone.BIT_VISIBLE;
      bits |= PMX.Bone.BIT_CONTROL;
      b.bits = bits;

      b.nameJa = `bone${_pad(i, 3)}`;
      b.nameEn = b.nameJa;

      b.parent = i - 1;
      b.layer = 0;

      switch(i) { // #1
      case 0:
        b.nameJa = '全ての親';
        b.nameEn = 'root';
        break;
      case 1:
        b.nameJa = '操作中心'; // 視点基準
        b.nameEn = 'view cnt bone';
        b.parent = -1;
        break;
      case centerBoneIndex:
        b.parent = 0;
        b.nameJa = 'センター';
        b.nameEn = 'center';
        break;
      }

      if (b) {
        this.bones.push(b);
      }
    }

    { // モーフ 0個 TODO: 3個
      for (let i = 0; i < 3; ++i) {
        const m = new PMX.Morph();
        m.nameJa = 'morph000';
        m.nameEn = 'morph000';
        m.type = 1;
        this.morphs.push(m);
      }
    }

    { // ボーングループフレーム
      for (let i = 0; i < 3; ++i) {
        const f = new PMX.Frame();
        f.nameJa = 'その他のボーンたち';
        f.nameEn = `frame00${i}`;
        f.specialFlag = 0;
        f.bones = [];

        if (i === 0) {
          f.nameJa = 'Root';
          f.specialFlag = 1;
          f.bones.push(0);
        } else if (i === 1) {
          f.nameJa = '表情';
          f.specialFlag = 1;
        } else {
          for (let j = 1; j < this.bones.length; ++j) {
            f.bones.push(j);
          }
        }
        this.frames.push(f);
      }
    }

  }

}


if (typeof exports !== 'undefined') {
  if (typeof module !== 'undefined' && module.exports) {
    exports.module = exports = HalfCapsule;
  }
  exports.HalfCapsule = HalfCapsule;
} else {
  _global.HalfCapsule = HalfCapsule;
}

})(globalThis);


