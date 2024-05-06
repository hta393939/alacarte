/**
 * @file transobject.js
 */
// 変形を生成する
// make1() しかない

(function(_global) {

/**
 * @param {number} v 値
 */
const _pad = (v, n = 2) => {
  return String(v).padStart(n, '0');
};

/**
 * 線形補間の結果を返す
 * @param {number} a 0.0 のとき
 * @param {number} b 1.0 のとき
 * @param {number} t 
 * @returns {number}
 */
const _lerp = (a, b, t) => {
  return a + (b - a) * t;
};

class TransObjectBuilder extends PMX.Maker {
  constructor() {
    super();

/**
 * 頂点インデックスのオフセット
 */
    this._vertexIndexOffset = 0;
/**
 * 面頂点インデックスのオフセット
 */
    this._faceIndexOffset = 0;
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
 * 0全ての - 1視点 - 2センター - 3 - 4 - 5
 */
  make1() {
    this.debug = 1;

    const d = new Date();
    const scale = 1.0;
/**
 * 上向きがプラス
 */
    const xdeg = 10;
    const ydeg = 0;
    const zdeg = 0;
    const step = 0.1;
/**
 * 戻してスケールかけて回転してオフセットする
 */
    let transMat = new Mat4();
    let rotMat = new Mat4();
    let scaleMat = Mat4.Scale(scale);
    {
      const m1 = new Mat4();
      Mat4.Mul(Mat4.RotZL(zdeg),
        Mat4.RotXL(xdeg),
        m1);
      Mat4.Mul(m1, Mat4.RotYL(ydeg),
        rotMat);

// 戻す
      Mat4.Mul(Mat4.MovL(0, 0, 0), scaleMat,
        m1);
      const m2 = new Mat4();
      Mat4.Mul(m1, rotMat, m2);
// 進める
      Mat4.Mul(m2, Mat4.MovL(0, 0, 0),
        transMat);
    }


    this.head.nameEn = 'transform';
    this.head.nameJa = this.head.nameEn;
    this.head.commentEn = `${d.toLocaleString()}\r\ntransform`;
    this.head.commentJa = this.head.commentEn;

    let div = 8;
    let ringnums = [0, 0];

    let uvtype = 'la';
    const la = {
      size: 2048,
      x: 440,
      y: 71,
      y1: 76,
      y2: 92,
      y3: 112,
    };

/**
 * 変形ベースボーンインデックス
 */
    const baseBoneIndex = 3;
/**
 * 中心
 */
    const bodyBoneIndex = 4;

/**
 * 先端ボーンインデックス
 */
    const topBoneIndex = 5;
/**
 * 標準半径
 */
    let _stdk = 0.4;
    const _rootHeight = 0.02;
/**
 * 裾
 */
    const _arroundInR = 1.8;
    const funcs = {
      a: (_i, _j, _t) => {
        return {
          t: _t,
        rx: 1 * _t * 0.5 * _stdk, ry: 0.9 * _t * 0.5 * _stdk,
        z: - (0.95 + 0.05 * _t),
        };
      },
      b: (_i, _j, _t) => { // 1/4
        return {
          t: _t,
        rx: (0.5 + 0.5 * _t) * _stdk,
        ry: (0.5 + 0.5 * _t) * 0.9 * _stdk,
        z: - (1 - 0.2 * _t * _t),
        };
      },
      c: (_i, _j, _t) => { // upper
        let k = 1 + _t * 0.05;
        return {
          t: _t,
          rx: 1 * _stdk * k, ry: 0.9 * _stdk * k,
          z: - _lerp(0.8, 0.5, _t),
        };
      },
      d: (_i, _j, _t) => {
        let k = _lerp(1.05, 1, _t);
        return { // lower
          t: _t,
          rx: 1 * _stdk * k, ry: 0.9 * _stdk * k,
          z: - _lerp(0.5, _rootHeight, _t),
        }
      },
      e: (_i, _j, _t) => {
        let k = 1;
        return {
          name: 'rootcyl',
          t: _t,
          rx: 1 * _stdk * k, ry: 1 * _stdk * k,
          z: - _lerp(_rootHeight, 0, _t),
        }
      },
      ra: (_i, _j, _t) => {
        return {
          rx: (1 + (_arroundInR - 1) * _t) * _stdk,
          ry: (1 + (_arroundInR - 1) * _t) * _stdk,
          z: 0.2 * _t * _t,
        }
      },
      rb: (_i, _j, _t) => {
        let rr = _lerp(_arroundInR, _arroundInR + 1, _t);
        return {
          rx: rr * _stdk,
          ry: rr * _stdk,
          z: 0.2 + _t * 0.05,
        }
      },
    };



    {
      let name = 'tex/LA_body_c.png';
      this.textures.push(name, name);
//            this.textures.push('a000.png');
//            this.textures.push('a001.png');
    }

    for (let i = 0; i < 2; ++i) { // 材質
      const m = new PMX.Material();
      m.nameJa = `材質00${i}`;
      m.nameEn = `mtl00${i}`;
      m.texIndex = 0;
      m.diffuse = [1, 1, 1, 1];
      m.specular = [0.2, 0.2, 0.2];
      m.specPower = 0.5;
      m.ambient = [0.7, 0.7, 0.7];
      m.edgeColor = [156/255, 130/255, 48/255, 1];
      let bits = PMX.Material.BIT_GROUND
        | PMX.Material.BIT_TOMAP
        | PMX.Material.BIT_SELFSHADOW
      m.bitFlag = bits;

      m.sharetoonflag = 0;
      m.sharetoonindex = -1;

      if (i === 0) {
        for (let k = 0; k < ringnums[0] - 1; ++k) {
          for (let j = 0; j < div; ++j) {
            let v0 = j + (div + 1) * k;
            let v1 = v0 + 1;
            let v2 = v0 + (div + 1);
            let v3 = v2 + 1;
            m.faces.push([v0, v1, v2]);
            m.faces.push([v1, v3, v2]);
          }
        }
      } else {
        for (let k = 0; k < ringnums[1] - 1; ++k) {
          for (let j = 0; j < div; ++j) {
            let v0 = j + (div + 1) * (k + ringnums[0]);
            let v1 = v0 + 1;
            let v2 = v0 + (div + 1);
            let v3 = v2 + 1;
            m.faces.push([v0, v1, v2]);
            m.faces.push([v1, v3, v2]);
          }
        }
      }
      this.materials.push(m);
    }

/**
 * まったく衝突しない剛体グループ(0-origin) 0x0000
 * 0xf---
 */
    const RIGID_IGNORE_GROUP = 13;
/**
 * 普通の衝突グループ(0-origin)
 * 0x-f--
 * 自分自身には当たらないので 0x00ff
 */
    const RIGID_DEFAULT_GROUP = 9;

    for (let i = 0; i <= 10; ++i) { // ボーン

      const rr = 1;
/**
 * ボーン
 */
      const b = new PMX.Bone();
/**
 * 剛体
 */
      const r = new PMX.Rigid();
      r.nameJa = `rb${_pad(i, 2)}`;
      r.nameEn = r.nameJa;
      r.shape = PMX.Rigid.SHAPE_CAPSULE;

      let x = 0;
      let y = 0;
      let z = -i * step;
      r.p = [x, y, z];
      r.rot = [Math.PI * 0.5, 0, 0];
      r.size = [rr * scale, 1 * scale, 1 * scale];
      r.friction = 100;

      let bits = PMX.Bone.BIT_MOVE | PMX.Bone.BIT_ROT
        | PMX.Bone.BIT_VISIBLE;
      bits |= PMX.Bone.BIT_CONTROL;
      b.bits = bits;

      b.nameJa = `bone${_pad(i, 3)}`;
      b.nameEn = b.nameJa;

      b.parent = i - 1;

      switch(i) {
      case 0:
        b.nameJa = '全ての親';
        b.nameEn = 'root';
        r.type = PMX.Rigid.TYPE_STATIC;
        r.group = RIGID_IGNORE_GROUP;
        r.groupFlags = 0x0000;
        r.shape = PMX.Rigid.SHAPE_SPHERE;
        r.size = [0.01 * scale, 0.01 * scale, 0.01 * scale];
        break;
      case 1:
        b.nameJa = '視点基準'; // 視点基準
        b.nameEn = 'viewbase';
        b.parent = -1;
        r.type = PMX.Rigid.TYPE_STATIC;
        r.group = RIGID_IGNORE_GROUP;
        r.groupFlags = 0x0000;
        r.shape = PMX.Rigid.SHAPE_SPHERE;
        r.size = [0.01 * scale, 0.01 * scale, 0.01 * scale];
        break;
      case 2:
        b.parent = 0;
        b.nameJa = 'センター';
        b.nameEn = 'center';
        r.type = PMX.Rigid.TYPE_STATIC;
        r.group = RIGID_IGNORE_GROUP;
        r.groupFlags = 0x0000;
        r.shape = PMX.Rigid.SHAPE_SPHERE;
        r.size = [0.01 * scale, 0.01 * scale, 0.01 * scale];
        break;

      case topBoneIndex:
        r.type = PMX.Rigid.TYPE_DYNAMIC;

        r.group = RIGID_DEFAULT_GROUP;
        r.groupFlags = 0x00ff;
        r.shape = PMX.Rigid.SHAPE_CAPSULE;
        // 半径、高さ、不使用
        r.size = [(_stdk - 0.0) * scale, 0.3 * scale, 1 * scale];
        r.p[2] = -5 * step;
        break;

      default:
        r.type = PMX.Rigid.TYPE_STATIC;
        r.group = RIGID_IGNORE_GROUP;
        r.groupFlags = 0x0000;
        r.shape = PMX.Rigid.SHAPE_SPHERE;
        r.size = [0.01 * scale, 0.01 * scale, 0.01 * scale];            
        break;
      }
      b.p = [...r.p];

      {
        r._boneName = (r.bone >= 0) ? b.nameJa: '';
      }

      this.bones.push(b);
      this.rigids.push(r);
    }

//// 頂点
    for (let i = 0; i <= 25; ++i) { // 本体 小さい方が先
      for (let j = 0; j <= div; ++j) {
        const v = new PMX.Vertex();
        v.deformType = PMX.Vertex.DEFORM_BDEF4;
        v.joints = [bodyBoneIndex, 0, 0, 0];
        v.weights = [1, 0, 0, 0];
        {
          v._boneName = v.joints.map(v => this.bones[v].nameJa);
        }

        let obj = {};
        if (i <= 5) {
          obj = funcs.a(i, j, i / 5);
        } else if (i <= 10) {
          obj = funcs.b(i, j, (i - 5) / 5);
        } else if (i <= 15) {
          obj = funcs.c(i, j, (i - 10) / 5);
        } else if (i <= 20) {
          obj = funcs.d(i, j, (i - 15) / 5);
        } else if (i <= 25) {
          obj = funcs.e(i, j, (i - 20) / 5);
        }

        let hang = Math.PI * 2 * j / div;
        const cs = Math.cos(hang);
        const sn = Math.sin(hang);
        let x = cs * obj.rx;
        let y = sn * obj.ry;
        let z = obj.z;
        let uvr = 0.5 * i / div;

        v.n = this.normalize([x, y, z]);
        v.p = [x, y, z];
        v.uv = [
          0.5 + x * uvr,
          0.5 + y * uvr,
        ];
        if (uvtype === 'la') {
          let k = i / 25;
          uvr = (la.y2 - la.y) / la.size;
          v.uv = [
            la.x / la.size + cs * uvr * k,
            la.y / la.size - sn * uvr * k,
          ];
        }
        if (obj.name === 'rootcyl') {
          v.deformType = PMX.Vertex.DEFORM_SDEF;
          const k = 1 - z / _rootHeight;
          v.joints = [baseBoneIndex,
            bodyBoneIndex, 0, 0];
          v.weights = [k, 1 - k, 0, 0];
          v.c = [0, 0, v.p[2]];
          v.r1 = [0, 0, _rootHeight];
          v.r0 = [0, 0, 0];
        }


        this.vts.push(v);
      }
      ringnums[0] += 1;
    }
// 頂点
    for (let i = 0; i <= 10; ++i) { // 周り
      for (let j = 0; j <= div; ++j) {
        let obj = {};
        if (i <= 5) {
          obj = funcs.ra(i, j, i / 5);
        } else if (i <= 10) {
          obj = funcs.rb(i, j, (i - 5) / 5);
        }

        let hang = Math.PI * 2 * j / div;
        let x = Math.cos(hang) * obj.rx;
        let y = Math.sin(hang) * obj.ry;
        let z = obj.z;
        let uvr = (1 + i * 3 / 8) / 4 * 0.5;
        const v = new PMX.Vertex();
        v.n = this.normalize([x, y, -1]);
        v.p = [x, y, z];
        v.uv = [
          0.5 + x * uvr,
          0.5 + y * uvr,
        ];
        if (uvtype === 'la') {
          uvr = (la.y3 - la.y1) / la.size;
          v.uv = [
            la.x / la.size + x * uvr,
            la.y / la.size - y * uvr,
          ];
        }
        v.deformType = PMX.Vertex.DEFORM_BDEF4;
        v.joints = [baseBoneIndex, 0, 0, 0];
        v.weights = [1, 0, 0, 0];
        {
          v._boneName = v.joints.map(v => this.bones[v].nameJa);
        }

        this.vts.push(v);
      }
      ringnums[1] += 1;
    }
//// 頂点


    { // モーフ
      for (let i = 0; i < 0; ++i) {
        const m = new PMX.Morph();
        m.nameJa = 'morph000';
        m.nameEn = 'morph000';
        m.type = 1;
        this.morphs.push(m);
      }
    }

    { // ボーングループフレーム
      for (let i = 0; i < 2; ++i) {
        const f = new PMX.Frame();
        f.nameJa = 'その他のボーンたち';
        f.nameEn = 'frame001';
        f.bones = [];
        if (i === 0) {
          f.nameEn = 'root';
          f.nameJa = f.nameEn;
          f.bones.push(0);
        } else {
          for (let j = 1; j <= 10; ++j) {
            f.bones.push(j);
          }
        }
        this.frames.push(f);
      }
    }

    { // ジョイント
      for (let i = 0; i < 1; ++i) {
        const j = new PMX.Joint();
        j.rigids = [i+4, i+5];
        {
          j._rigidName = j.rigids.map(v => this.rigids[v].nameJa);
        }

        j.nameEn = `j${_pad(j.rigids[0], 3)}`;
        j.nameJa = j.nameEn;
        j.p = [
          0,
          0,
          - step * (j.rigids[0] + j.rigids[1]) / 2,
        ];
        j.moveUpper = [0, 0, 0];
        j.moveLower = [0, 0, 0];
        let ang = Math.PI * 90 / 180;
        j.rotUpper = [ang, ang, ang];
        j.rotLower = [-ang, -ang, -ang];
        let k = 0.01;
        j.springRot = [k, k, k];
        this.joints.push(j);
      }
    }

    { // 参照名
      for (const b of this.bones) {
        if (b.parent >= 0) {
          b._parentName = this.bones[b.parent].nameJa;
        }
      }
    }

    { // 変形の適用
      for (const v of this.vts) {
        v.p = transMat.transform(...v.p).to3();
        v.c = transMat.transform(...v.c).to3();
        v.r0 = transMat.transform(...v.r0).to3();
        v.r1 = transMat.transform(...v.r1).to3();

        v.n = rotMat.transform(...v.n).to3();
      }
      for (const b of this.bones) {
        b.p = transMat.transform(...b.p).to3();
      }
      for (const r of this.rigids) {
        r.p = transMat.transform(...r.p).to3();
        // r.rot 回転できねーw
        r.rot = [r.rot[0] + xdeg, r.rot[1] + ydeg, r.rot[2] + zdeg];
      }
      for (const j of this.joints) {
        j.p = transMat.transform(...j.p).to3();
        // j.rot 回転できねーw
        j.rot = [j.rot[0] + xdeg, j.rot[1] + ydeg, j.rot[2] + zdeg];
      }
    }

  }

/**
 * オフセットはここでまとめて付与する
 * @returns 
 */
  toString() {
    const lines = [];

    const num = this.vts.length;
    for (let i = 0; i < num; ++i) {
      const v = this.vts[i];
      v._index = i + this._vertexIndexOffset;
      lines.push(v.toCSV());
    }

// 後から書き換える場合
    let materialName = '\u88f8';
    materialName = '材質1';

    let count = this._faceIndexOffset;
    for (const m of this.materials) {
      for (const f of m.faces) {
        const face = new PMX.Face();
        face._index = count;
        count += 1;
        face._materialName = materialName;
        face.indices = f.map(v => v + this._vertexIndexOffset);
        lines.push(face.toCSV());
      }
    }

    for (const b of this.bones) {
      lines.push(b.toCSV());
    }
    for (const r of this.rigids) {
      lines.push(r.toCSV());
    }
    for (const j of this.joints) {
      lines.push(j.toCSV());
    }
    lines.push('');
    return lines.join('\n');
  }

}


if (typeof exports !== 'undefined') {
  if (typeof module !== 'undefined' && module.exports) {
    exports = module.exports = TransObjectBuilder;
  }
  exports.TransObjectBuilder = TransObjectBuilder;
} else {
  _global.TransObjectBuilder = TransObjectBuilder;
}

})(globalThis);


