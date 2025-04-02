export class Util {
  /**
   * 
   * @param {Blob} blob 
   * @param {string} name 
   */
  static download(blob, name) {
    const a = document.createElement('a');
    a.download = name;
    a.href = URL.createObjectURL(blob);
    a.click();
  }

  static async loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.addEventListener('load', () => {
        resolve(img);
      });
      img.addEventListener('error', (err) => {
        reject(err);
      });
      img.src = url;
    });
  }

  /**
   * 
   * @param {string} url 
   * @param {HTMLCanvasElement} canvas 書き出し先
   */
  static async loadToCanvas(url, canvas) {
    const img = await Util.loadImage(url);
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext('2d');
    c.clearRect(0, 0, w, h);
    c.drawImage(img, 0, 0);
  }

  static qmul(a, b) {
    const rea = a[3];
    const reb = b[3];
    return [
      rea * b[0] + reb * a[0] + a[1] * b[2] - a[2] * b[1],
      rea * b[1] + reb * a[1] + a[2] * b[0] - a[0] * b[2],
      rea * b[2] + reb * a[2] + a[0] * b[1] - a[1] * b[0],
      rea * reb - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
    ];
  }

  /**
   * 3次ベクトルをqで回転する
   * @param {[number,number,number]} v 
   * @param {[number,number,number,number]} q 
   * @returns 
   */
  static vrotq(v, q) {
    const a = Util.qmul(q, [...v, 0]);
    const b = Util.qmul(a, [q[0], q[1], q[2], -q[3]]);
    return [b[0], b[1], b[2]];
  }

  static cross(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }

  /**
   * 正規化した新しい配列を返す
   * @param {[number,number,number]} v 
   * @returns 
   */
  static newnorm(v) {
    const len = Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2);
    if (len === 0) {
      return [...v];
    }
    const k = 1 / len;
    return [v[0] * k, v[1] * k, v[2] * k];
  }

  /**
   * 
   * @param {[number,number,number]} a 正規化後
   * @param {[number,number,number]} b 正規化後
   * @param {number} t bの重さ 
   */
  static nlerp(a, b, t) {
    if (t <= 0) {
      return [...a];
    }
    if (t >= 1) {
      return [...b];
    }
    const cr = Util.newnorm(Util.cross(a, b));
    const dp = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const ang = Math.acos(dp) * t;
    const sn = Math.sin(ang * 0.5);
    const q = [cr[0] * sn, cr[1] * sn, cr[2] * sn, Math.cos(ang * 0.5)];
    return Util.vrotq(a, q);
  }

  /**
   * 真ん中で近似する角度線形
   * @param {[number,number,number]} a 正規化した後のベクトル
   * @param {[number,number,number]} b 正規化した後のベクトル
   * @param {number} t b の重さ
   * @param {number} c 残り回数
   */
  static halflerp(a, b, t, c) {
    if (t <= 0) {
      return [...a];
    }
    if (t >= 1) {
      return [...b];
    }
    if (c <= 0) {
      return Util.newnorm([0, 1, 2].map(i => (a[i] * (1 - t) + b[i] * t)));
    }

    const half = Util.newnorm(
      [0, 1, 2].map(i => a[i] + b[i])
    );

    if (t < 0.5) {
      return Util.halflerp(a, half, t * 2, c - 1);
    } else if (t > 0.5) {
      return Util.halflerp(half, b, (t - 0.5) * 2, c - 1);
    }
    return half;
  }

}
