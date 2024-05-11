/**
 * @file matl.js
 */

/**
 * 行列クラス
 */
class Mat {
/**
 * 
 * @param {number} inrow 行数 
 * @param {number} incol 列数
 */
  constructor(inrow = 4, incol = 4) {
    this._row = inrow;
    this._col = incol;
    this._m = new Float32Array(inrow * incol);
  }
/**
 * 内積
 * @param {Mat} a 
 * @param {Mat} b 
 * @param {number} limit 回転用の4元のときは3を指定する
 * @returns {number}
 */
  static Dot(a, b, limit = Infinity) {
    const num = Math.min(limit, a._m.length, b._m.length);
    let sum = 0;
    for (let k = 0; k < num; ++k) {
      sum += a._m[k] * b._m[k];
    }
    return sum;
  }

/**
 * a * b の行列の積を m に書き出す
 * @param {Mat} a 
 * @param {Mat} b 
 * @param {Mat} m 書き出し先
 */
  static Mul(a, b, m) {
    const num = Math.min(a._col, b._row);
    for (let i = 0; i < a._row; ++i) {
      for (let j = 0; j < b._col; ++j) {
        let sum = 0;
        for (let k = 0; k < num; ++k) {
          sum += a._m[a._col * i + k] * b._m[b._col * k + j];
        }
        m._m[m._col * i + j] = sum;
      }
    }
  }

/**
 * 先頭から3つを配列で返す
 * @returns {number[]}
 */
  to3() {
    return [this._m[0], this._m[1], this._m[2]];
  }

}

/**
 * [1, 2, 3, 1]
 */
class RowVec4 extends Mat {
/**
 * 4x4 のときは w = 1 で，
 * quaternion のときは w = 0 で
 * @param {*} x 
 * @param {*} y 
 * @param {*} z 
 * @param {*} w 
 * @returns 
 */
  static Make(x = 0, y = 0, z = 0, w = 0) {
    const v = new RowVec4();
    v._m = new Float32Array([x, y, z, w]);
    return v;
  }

/**
 * 外積を計算する
 * @param {*} a 
 * @param {*} b 
 */
  Cross(a, b) {
    const m = new RowVec4();
    m._m[0] = a._m[1] * b._m[2] - a._m[2] * b._m[1];
    m._m[1] = a._m[2] * b._m[0] - a._m[0] * b._m[2];
    m._m[2] = a._m[0] * b._m[1] - a._m[1] * b._m[0];
    m._m[3] = a._m[3] * b._m[3];
    return m;
  }

  constructor() {
    super(1, 4);
  }
}

/**
 * 未実装
 */
class Quaternion {
  constructor(x = 0, y = 0, z = 0, w = 0) {
    this._m = [x, y, z, w];
  }
/**
 * 未実装
 * @param {*} a 
 * @param {*} b 
 * @returns 
 */
  mul(a, b) {
    const q = new Quaternion();
    q._m[3] = a._m[3] * b._m[3] - a._m[0] * b._m[0] - a._m[1] * b._m[1] - a._m[2] * b._m[2];
    q._m[0] = 0;
    q._m[1] = 0;
    q._m[2] = 0;
    return q;
  }
/**
 * 未実装
 */
  rot() {

  }
}

/**
 * 4x4 行列
 */
class Mat4 extends Mat {
  static From16(array) {
    const m = new Mat4();
    m._m = new Float32Array(array);
    return m;
  }

  constructor() {
    super(4, 4);
  }

  static RotXL(deg) {
    const ang = Math.PI * deg / 180;
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    const el = [
      1, 0, 0, 0,
      0, c, s, 0,
      0,-s, c, 0,
      0, 0, 0, 1,
    ];
    return Mat4.From16(el);
  }
  static RotYL(deg) {
    const ang = Math.PI * deg / 180;
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    const el = [
      c, 0,-s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1,
    ];
    return Mat4.From16(el); 
  }
  static RotZL(deg) {
    const ang = Math.PI * deg / 180;
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    const el = [
      c, s, 0, 0,
      -s,c, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ];
    return Mat4.From16(el);
  }
/**
 * 左手系の平行移動行列
 * @param {*} x 
 * @param {*} y 
 * @param {*} z 
 * @returns 
 */
  static MovL(x, y, z) {
    const el = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      x, y, z, 1,
    ];
    return Mat4.From16(el);
  }

/**
 * 単位行列の定数倍
 * @param {number} k
 * @returns {Mat4}
 */
  static Scale(k) {
    const el = [
      k, 0, 0, 0,
      0, k, 0, 0,
      0, 0, k, 0,
      0, 0, 0, k,
    ];
    return Mat4.From16(el);
  }

/**
 * この行列で変換する
 * @param {number} x 
 * @param {number} y 
 * @param {number} z 
 * @returns {RowVec4}
 */
  transform(x, y, z) {
    const v = RowVec4.Make(x, y, z, 1);
    const result = new RowVec4(0, 0, 0, 1);
    Mat.Mul(v, this, result);
    return result;
  }

/**
 * 未実装
 * global ZXY に分解する
 * @returns 
 */
  toGlobalZXY() {
    const result = new RowVec4(0, 0, 0, 0);
    const xbasis = this._m.slice(0, 3);
    const ybasis = this._m.slice(4, 7);
    const zbasis = this._m.slice(8, 11);
    if (zbasis[2] == 0 && zbasis[0] == 0) {
      if (zbasis[1] > 0) {
        result._m[0] = -90;
        // xbasis を回転する
      } else {
        result._m[0] = 90;
      }
      return result;
    }

    // 符号不明
    result._m[1] = Math.atan2(zbasis[2], zbasis[0]) * 180 / Math.PI;

    result._m[0] = 0;
    result._m[2] = 0;
    return result;
  }

}

/**
 * 3次元ベクトル
 */
class V3 {
/**
 * コンストラクタ
 * @param {number} x 
 * @param {number} y 
 * @param {number} z 
 */
  constructor(x = 0, y = 0, z = 0) {
    this.p = [x, y, z];
  }
/**
 * 新しいインスタンスを返す
 */
  clone() {
    const v = new V3(...this.p);
    return v;
  }
/**
 * 破壊
 */
  normalize() {
    let sum = this.p[0] ** 2
      + this.p[1] ** 2
      + this.p[2] ** 2;
    if (sum > 0) {
      const k = 1 / Math.sqrt(sum);
      this.p[0] *= k;
      this.p[1] *= k;
      this.p[2] *= k;
    }
    return this;
  }
/**
 * 破壊
 * @param {number} k 
 * @returns 
 */
  scale(k) {
    this.p[0] *= k;
    this.p[1] *= k;
    this.p[2] *= k;
    return this;
  }
/**
 * 破壊
 * @param {V3} b 
 * @returns 
 */
  add(b) {
    this.p[0] += b.p[0];
    this.p[1] += b.p[1];
    this.p[2] += b.p[2];
    return this;
  }

/**
 * 破壊
 * @param {V3} b 
 * @returns 
 */
  sub(b) {
    this.p[0] -= b.p[0];
    this.p[1] -= b.p[1];
    this.p[2] -= b.p[2];
    return this;
  }
/**
 * 長さを返す
 * @returns {number}
 */
  length() {
    return Math.sqrt(this.p[0] ** 2
      + this.p[1] ** 2
      + this.p[2] ** 2);
  }

/**
 * 独立した配列を返す
 */
  asArray() {
    return [...this.p];
  }
}

class Util {
  constructor() {
    this.seed = 0;
    this.A = 214013;
    this.C = 2531011;
  }
  srand(seed) {
    this.seed = seed % 65536;
  }

  rand() {
    let next = this.A * this.seed + this.C;
    this.seed = next % 4294967296;
    if (next < 0) {
      console.warn('minus', next);
    }
    const ret = Math.floor(next / 65536) & 0x7fff;
    return ret;
  }

/**
 * blender workbench
 * Quick creation of an orthonormal basis
 * I.z は -1 以外
 */
  static MakeBasis(x, y, z) {
    const a = 1.0 / (1.0 + z);
    const b = - x * y * a;
    const bx = [1.0 - x * x * a, b, -x];
    const by = [b, 1.0 - y * y * a, -y];
    const bz = [x, y, z];
    return [bx, by, bz];
  }

/**
 * 基底number[] が3要素の配列を返す
 * @param {*} x 
 * @param {*} y 
 * @param {*} z 
 * @returns 
 */
  static MakeBasisLH(x, y, z) {
    const result = Util.MakeBasis(x, y, -z);
    result[0][2] *= -1;
    result[1][2] *= -1;
    result[2][2] *= -1;
    return result;
  }

/**
 * 重心他を計算して返す
 * @param {number[][]} ar 
 * @returns {{avg, normal: number[], radius: number}}
 */
  static Avg(ar) {
/**
 * 点の個数
 */
    const num = ar.length;
    if (num === 0) {
      return [];
    }
/**
 * 重心計算
 */
    const sum = [0, 0, 0];
    for (const v3 of ar) {
      sum[0] += v3[0];
      sum[1] += v3[1];
      sum[2] += v3[2];
    }
    const k = 1 / num;
    sum[0] *= k;
    sum[1] *= k;
    sum[2] *= k;

    let radius = 0;
    const offsets = [];
    for (const v3 of ar) {
      const p = [
        v3[0] - sum[0],
        v3[1] - sum[1],
        v3[2] - sum[2],
      ];
      offsets.push(p);

      radius += Math.sqrt(
        p[0] ** 2 + p[1] ** 2 + p[2] ** 2
      );
    }
    radius *= k;

// ピックした組みで外積を取って平均して近似法線とする
    let normal = [0, 0, 0];
    const pickNum = 10;
    for (let i = 0; i < pickNum; ++i) {
      const i0 = Math.floor(Math.random() * num);
      const i1 = Math.floor(Math.random() * num);
      // cross i0 - 中心(0, 0, 0), i1 - 中心
      const v0 = offsets[i0];
      const v1 = offsets[i1];
      const cross = [
        v0[1] * v1[2] - v0[2] * v1[1],
        v0[2] * v1[0] - v0[0] * v1[2],
        v0[0] * v1[1] - v0[1] * v1[0],
      ];
      if (cross[2] < 0) {
        cross[0] = -cross[0];
        cross[1] = -cross[1];
        cross[2] = -cross[2];
      }
      normal[0] += cross[0];
      normal[1] += cross[1];
      normal[2] += cross[2];
    }
    const s2 = Math.sqrt(normal[0] ** 2 + normal[1] ** 2 + normal[2] ** 2);
    if (s2 > 0) {
      const kn = 1 / s2;
      normal[0] *= kn;
      normal[1] *= kn;
      normal[2] *= kn;
    }

    return { avg: sum, offsets, normal, radius };
  }


}

