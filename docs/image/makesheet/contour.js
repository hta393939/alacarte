
export class Const {
  /** 0: 左 */
  static DIR_LEFT = 0;
  /** 1: 上 */
  static DIR_UP = 1;
  static DIR_RIGHT = 2;
  static DIR_DOWN = 3;
}

export class Arrow {
  constructor(parent) {
    /** @type {Dot} */
    this.parent = parent;
    /** 有効かどうか */
    this.enable = false;
    /** 採用済みかどうか */
    this.passed = false;
    /** 矢の向き */
    this.dir = Const.DIR_RIGHT;
    /** dir を向いたときの右手 */
    this.in = Const.DIR_DOWN;
    this.pts = [[0, 0], [1, 0]];
    this.x = 0;
    this.y = 0;
    this.sx = 0;
    this.sy = 0;
    this.ex = 0;
    this.ey = 0;
    this.side = Const.DIR_UP;
    this.col = 0x000000;
    this.a = 0;
  }

  set(param) {
    Object.assign(this, param);
    return this;
  }
}

export class Dot {

  constructor() {
    /** 0-255 */
    this.a = 0;
    /** a を含まない 0x00rrggbb */
    this.col = 0;

    this.x = 0;
    this.y = 0;

    /**
     * 左と上隣接
     * @type {Arrow[]}
     */
    this.ns = [
      new Arrow(this),
      new Arrow(this),
      new Arrow(this),
      new Arrow(this),
    ];
  }

  /**
   * a も込みで色が同じか?
   * a がどちらも0の場合は同一とみなす
   * @param {Dot} b 
   */
  eqCols(b) {
    if (this.a === 0) {
      if (b.a === 0) {
        return true;
      }
      return false;
    }
    return (this.col === b.col) && (this.a === b.a);
  }

  /**
   * 順番を考慮した向き有りエッジの始点と終点を返す
   */
  calcLP(edge, dir) {
    let ret = [
      [0, 0],
      [0, 0],
    ];
    if (edge === Const.DIR_LEFT) { // ドットの左エッジ
      if (dir === Const.DIR_DOWN) { // 上から下
        ret = [[0, 0], [0, 1]];
      } else { // 下から上
        ret = [[0, 1], [0, 0]];
      }
    } else if (edge === Const.DIR_UP) { // ドットの上エッジ
      if (dir === Const.DIR_RIGHT) { // 左から右
        ret = [[0, 0], [1, 0]];
      } else { // 右から左
        ret = [[1, 0], [0, 0]];
      }
    } else { // 基本的に使用しない
      console.warn('calcLP warn', edge, this);
      if (edge === Const.DIR_RIGHT) {
        if (dir === Const.DIR_DOWN) {
          ret = [[1, 0], [1, 1]];
        } else {
          ret = [[1, 1], [1, 0]];
        }
      } else {
        if (dir === Const.DIR_RIGHT) {
          ret = [[0, 1], [1, 1]];
        } else {
          ret = [[1, 1], [0, 1]];
        }
      }
    }

    for (let i = 0; i < 2; ++i) {
      ret[i][0] += this.x;
      ret[i][1] += this.y;
    }
    return ret;
  }

}


export class Route {
  constructor() {
    this.col = 0x000000;
    this.a = 0;

    /** [x,y] の配列 @type {number[][]} */
    this.pts = [];
  }

  static normal(vs) {
    let sum = vs[0] ** 2 + vs[1] ** 2;
    let k = (sum > 0) ? 1 / Math.sqrt(sum) : 0;
    return [vs[0] * k, vs[1] * k];
  }

  connectLines() {
    const ret = [];

    let curStart = this.pts[0];
    let curEnd = null;
    let index = 1;
    /** 最後の方向ベクトル */
    let dv = [0, 0];
    while (index < this.pts.length) {
      curEnd = this.pts[index];
      dv = Route.normal([curEnd[0] - curStart[0], curEnd[1] - curStart[1]]);
      if (dv[0] === 0 && dv[1] === 0) {
        index += 1;
        continue;
      }
      break;
    }
    if (!curEnd) {
      return [];
    }

    while (index < this.pts.length) {
      let next = this.pts[index];
      const nextDv = Route.normal([next[0] - curEnd[0], next[1] - curEnd[1]]);
      if (nextDv[0] !== 0 || nextDv[1] !== 0) {
        if (nextDv[0] === dv[0] && nextDv[1] === dv[1]) {
          // 同じ向き
          curEnd = [...next];
        } else {
          // 異なる向き
          ret.push(curStart);
          curStart = [...curEnd];
          curEnd = [...next];
          dv = nextDv;
        }
      }
      index += 1;
    }
    ret.push(curStart);
    ret.push(curEnd);
    console.log('connectLines', ret);
    return ret;
  }

}

export class Contour {


  constructor() {
    this.width = 10;
    this.height = 10;
    /**
     * @type {Dot[]}
     */
    this.dots = [];
  }

  /**
   * 
   * @param {number} r 0-255
   * @param {number} g 
   * @param {number} b 
   */
  static cstoone(r, g, b) {
    return (r << 16) | (g << 8) | b;
  }

  /**
   * 
   * @param {HTMLCanvasElement} canvas 
   */
  init(incanvas) {
    const ow = incanvas.width;
    const oh = incanvas.height;
    const w = ow + 2;
    const h = oh + 2;
    this.width = w;
    this.height = h;
    /** @type {HTMLCanvasElement} */
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext('2d');
    c.drawImage(incanvas, 1, 1);
    const img = c.getImageData(0, 0, w, h);

    for (let i = 0; i < h; ++i) {
      for (let j = 0; j < w; ++j) {
        let index = j + w * i;
        let offset = index * 4;
        let r = img.data[offset];
        let g = img.data[offset+1];
        let b = img.data[offset+2];
        let a = img.data[offset+3];

        const dot = new Dot();
        this.dots.push(dot);
        dot.x = j;
        dot.y = i;
        dot.a = a;
        dot.col = Contour.cstoone(r, g, b);
      }
    }

    for (let i = 0; i < h; ++i) {
      for (let j = 0; j < w; ++j) {
        let index = j + w * i;

        const dot = this.dots[index];
        if (dot.a === 0) {
          continue;
        }
        let x = dot.x;
        let y = dot.y;

        for (let k = 0; k < 4; ++k) {
          const arrow = dot.ns[k];
          arrow.enable = false;
          arrow.passed = false;
          arrow.col = dot.col;
          arrow.a = dot.a;
        }

        if (j >= 1) { // 左を見る
          const comp = this.dots[index - 1];
          const arrow = dot.ns[Const.DIR_LEFT];
          arrow.set({ enable: !dot.eqCols(comp), dir: Const.DIR_UP, sx: x, sy: y + 1, ex: x, ey: y });
        }
        if (i >= 1) { // 上を見る
          const comp = this.dots[index - w];
          const arrow = dot.ns[Const.DIR_UP];
          arrow.set({ enable: !dot.eqCols(comp), dir: Const.DIR_RIGHT, sx: x, sy: y, ex: x+1, ey: y });
        }
        if (j < w - 1) { // 右を見る
          const comp = this.dots[index + 1];
          const arrow = dot.ns[Const.DIR_RIGHT];
          arrow.set({ enable: !dot.eqCols(comp), dir: Const.DIR_DOWN, sx: x+1, sy: y, ex: x+1, ey: y+1 });
        }
        if (i < h - 1) { // 下を見る
          const comp = this.dots[index + w];
          const arrow = dot.ns[Const.DIR_DOWN];
          arrow.set({ enable: !dot.eqCols(comp), dir: Const.DIR_LEFT, sx: x + 1, sy: y + 1, ex: x, ey: y + 1 });
        }

      }
    }

  }

  
  search() {
    debugger;

    const ret = [];
    const w = this.width;
    const h = this.height;
    for (let i = 0; i < h; ++i) {
      for (let j = 0; j < w; ++j) {
        let index = j + w * i;
        /** 開始ドット */
        const firstDot = this.dots[index];

        for (let k = 0; k < 4; ++k) {
          /** 最初の線分 */
          const firstArrow = firstDot.ns[k];
          if (!firstArrow.enable || firstArrow.passed) {
            continue;
          }

          let firstPt = [firstArrow.sx, firstArrow.sy];
          let secondPt = [firstArrow.ex, firstArrow.ey];

          // 探し回る
          const route = new Route();
          ret.push(route);
          route.col = firstDot.col;
          route.a = firstDot.a;
          if (route.a === 0) {
            console.warn('miss', firstPt, secondPt);
          }
          route.pts.push(firstPt);
          route.pts.push(secondPt);

          let neigh = firstArrow;
          neigh.passed = true;

          for (let cnt = 0; cnt < 100; ++cnt) {
            let x = neigh.ex;
            let y = neigh.ey;

            // 隣接を探す。
            neigh = null;
            // 論理ブロックで外に出ずに同じ色のつながる有向エッジが存在する
            /** @type {any[]} */
            let cands = [
{dx: x - 1, dy: y - 1, index: Const.DIR_DOWN }, // 左へ
{dx: x, dy: y - 1, index: Const.DIR_LEFT, }, // 上へ
{dx: x, dy: y, index: Const.DIR_UP, }, // 右へ
{dx: x - 1, dy: y, index: Const.DIR_RIGHT, }, // 下へ
              ];

              for (const cand of cands) {
                const arrow = this.dots[cand.dx + w * cand.dy].ns[cand.index];
                if (arrow.enable && !arrow.passed) {
                  if (arrow.col === route.col && arrow.a === route.a) {
                    neigh = arrow;
                  }
                }
              }

              // 見つからなかったら終了
              if (!neigh) {
                break;
              }
              neigh.passed = true;
              route.pts.push([neigh.ex, neigh.ey]);
          }

          route.pts = route.connectLines();
        }
      }
    }
    console.log('search', ret);
    return ret;
  }  

}


