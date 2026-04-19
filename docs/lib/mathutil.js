

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

  dot(b) {
    return this.x * b.x + this.y * b.y + this.z * b.z;
  }

  /**
   * 
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

}

export class Quaternion {
  constructor() {
    this._x = 0;
    this._y = 0;
    this._z = 0;
    this._w = 1;
  }

  /**
   * 最初の引数が w
   * @param {*} w 
   * @param {*} x 
   * @param {*} y 
   * @param {*} z 
   * @returns 
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
   * @param {*} x 
   * @param {*} y 
   * @param {*} z 
   * @param {*} w 
   * @returns 
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
   * @returns 
   */
  asArrayTopW() {
    return [this.w, this.x, this.y, this.z];
  }

  /**
   * 配列の最後が w
   * @returns 
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
    const rea = this.w;
    const reb = b.w;
    const ima = this.clone3();
    const imb = b.clone3();
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
   * 
   * @param {Vector3} v3 
   */
  static point(v3) {
    const ret = new Quaternion(v3.x, v3.y, v3.z);
    return ret;
  }

  real() {
    return new Vector3(this.x, this.y, this.z);
  }

  conjugate() {
    const ret = new Quaternion();
    ret.x = -this.x;
    ret.y = -this.y;
    ret.z = -this.z;
    ret.w = this.w;
    return ret;
  }

  /**
   * 
   * @param {Vector3} v3 
   */
  rot(v3) {
    const conj = this.conjugate();
    const pt = Quaternion.point(v3);
    const c1 = this.mul(pt);
    const c2 = c1.mul(conj);
    return c2.real();
  }

}
