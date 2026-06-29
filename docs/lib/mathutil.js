
/**
 * 2次元
 */
export class Vector2 {
  constructor(x = 0, y = 0) {
    this._x = 0;
    this._y = 0;
  }

  get x() {
    return this._x;
  }
  set x(val) {
    this._x = val;
  }

  get y() {
    return this._y;
  }
  set y(val) {
    this._y = val;
  }

  static fromArray(vs) {
    return new Vector2(vs[0], vs[1]);
  }

  asArray() {
    return [this.x, this.y];
  }

  /**
   * 
   * @param {Vector2} b 
   */
  dot(b) {
    return this.x * b.x + this.y * b.y;
  }

  length() {
    return Math.sqrt(this.dot(this));
  }

  /**
   * Z 成分
   * @param {Vector2} b 
   */
  cross(b) {
    return this.x * b.y - this.y * b.x;
  }

  normal() {
    const len = this.length();
    const k = (len > 0) ? 1 / len : 1;
    return new Vector2(this.x * k, this.y * k);
  }
}


/**
 * 3次元
 */
export class Vector3 {
  constructor(x = 0, y = 0, z = 0) {
    this._x = x;
    this._y = y;
    this._z = z;
  }

  set x(val) {
    this._x = val;
  }
  get x() {
    return this._x;
  }
  set y(val) {
    this._y = val;
  }
  get y() {
    return this._y;
  }
  set z(val) {
    this._z = val;
  }
  get z() {
    return this._z;
  }

  /**
   * 
   * @param {number[]} vs 
   */
  static fromArray(vs) {
    return new Vector3(vs[0], vs[1], vs[2]);
  }

  /**
   * x, y, z 配列を得る
   * @returns {Vector3}
   */
  asArray() {
    return [this.x, this.y, this.z];
  }

  /**
   * クローンを返す
   * @returns 
   */
  clone() {
    return Vector3.fromArray(this.asArray());
  }

  /**
   * 
   * @param {Vector3} b 
   * @returns 
   */
  dot(b) {
    return this.x * b.x + this.y * b.y + this.z * b.z;
  }

  /**
   * 外積
   * @param {Vector3} b 
   * @returns 
   */
  cross(b) {
    const ret = new Vector3();
    ret.x = this.y * b.z - this.z * b.y;
    ret.y = this.z * b.x - this.x * b.z;
    ret.z = this.x * b.y - this.y * b.x;
    return ret;
  }

  length() {
    return Math.sqrt(this.dot(this));
  }

  /**
   * 非破壊で新しいインスタンスで正規化ベクトルを返す
   * @returns 
   */
  normal() {
    const len = this.length();
    const k = (len > 0) ? 1 / len : 1;
    return new Vector3(this.x * k, this.y * k, this.z * k);
  }

  /**
   * 
   * @param {number} ka 
   * @param {Vector3} b
   * @param {number} kb
   */
  add(ka, b, kb) {
    const ret = new Vector3();
    ret.x = this.x * ka + b.x * kb;
    ret.y = this.y * ka + b.y * kb;
    ret.z = this.z * ka + b.z * kb;
    return ret;
  }

  /**
   * 2つのベクトルを先に正規化して内積を計算する
   * @param {Vector3} b 
   * @returns {number}
   */
  normaldot(b) {
    return this.normal().dot(b.normal());
  }

}

/**
 * クォータニオン
 */
export class Quaternion {
  constructor() {
    this._x = 0;
    this._y = 0;
    this._z = 0;
    this._w = 1;
  }

  /**
   * 最初の引数が w
   * @param {number} w 
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   * @returns {Quaternion}
   */
  static fromTopW(w, x, y, z) {
    const ret = new Quaternion();
    ret.x = x;
    ret.y = y;
    ret.z = z;
    ret.w = w;
    return ret;
  }

  /**
   * 最後の引数が w
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   * @param {number} w 
   * @returns {Quaternion}
   */
  static fromBottomW(x, y, z, w) {
    const ret = new Quaternion();
    ret.x = x;
    ret.y = y;
    ret.z = z;
    ret.w = w;
    return ret;
  }

  set x(val) {
    this._x = val;
  }
  get x() {
    return this._x;
  }
  set y(val) {
    this._y = val;
  }
  get y() {
    return this._y;
  }
  set z(val) {
    this._z = val;
  }
  get z() {
    return this._z;
  }

  set w(val) {
    this._w = val;
  }
  get w() {
    return this._w;
  }

  clone() {
    const ret = new Quaternion();
    ret.w = this.w;
    ret.x = this.x;
    ret.y = this.y;
    ret.z = this.z;
    return ret;
  }

  /**
   * 配列の先頭が w
   * @returns {number[]}
   */
  asArrayTopW() {
    return [this.w, this.x, this.y, this.z];
  }

  /**
   * 配列の最後が w
   * @returns {number[]}
   */
  asArrayBottomW() {
    return [this.x, this.y, this.z, this.w];
  }

  /**
   * b を右から掛ける
   * @param {Quaternion} b 
   * @returns 
   */
  mul(b) {
    const rea = this.re();
    const reb = b.re();
    const ima = this.im();
    const imb = b.im();
    const c1 = ima.cross(imb);
    const c2 = c1.add(1, ima, reb);
    const c3 = c2.add(1, imb, rea);
    const ret = new Quaternion();
    ret.x = c3.x;
    ret.y = c3.y;
    ret.z = c3.z;
    ret.w = rea * reb - this.x * b.x - this.y * b.y - this.z * b.z;
    return ret;
  }

  /**
   * v3.w がおそらく 0 になってるはずの三次元の点として取り出す
   * @param {Vector3} v3 
   */
  static point(v3) {
    return Quaternion.fromBottomW(v3.x, v3.y, v3.z, 0);
  }

  /**
   * 虚部を取り出す。新しいインスタンス
   * @returns {Vector3}
   */
  im() {
    return new Vector3(this.x, this.y, this.z);
  }
  /**
   * 実部を取り出す。新しい値
   * @returns {number}
   */
  re() {
    return this.w;
  }

  /**
   * 共役
   * @returns 
   */
  conjugate() {
    const ret = new Quaternion();
    ret.x = -this.x;
    ret.y = -this.y;
    ret.z = -this.z;
    ret.w = this.w;
    return ret;
  }

  /**
   * v3 を回転する
   * @param {Vector3} v3 
   */
  rot(v3) {
    const conj = this.conjugate();
    const pt = Quaternion.point(v3);
    const c1 = this.mul(pt);
    const c2 = c1.mul(conj);
    return c2.im();
  }

}



export class MathUtil {
  constructor() {

  }

  /**
   * 未実装
   */
  static f1() {

  }
  /**
   * 未実装
   */
  static f2() {

  }
}

