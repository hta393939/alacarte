
export class Const {
  /** 0: 左 */
  static DIR_LEFT = 0;
  /** 1: 上 */
  static DIR_UP = 1;
  static DIR_RIGHT = 2;
  static DIR_DOWN = 3;
}

export class Arrow {
  constructor() {
    this.enable = true;
    this.passed = false;
    /** 矢の向き */
    this.dir = Const.DIR_RIGHT;
    /** dir を向いたときの右手 */
    this.in = Const.DIR_DOWN;
    this.pts = [[0, 0], [1, 0]];
    this.x = 0;
    this.y = 0;
    this.ex = 0;
    this.ey = 0;
    this.side = Const.DIR_UP;
    this.col = 0x000000;
    this.a = 0;
  }

  init(param) {
    Object.assign(this, param);
    return this;
  }
}

export class Edge {

  constructor() {
    /** 通行可能かどうか */
    this.canMove = false;

    /**
     * ドットとしての位置
     */
    this.x = 0;
    this.y = 0;
    /** ドットのどちら側か。UP or LEFT */
    this.side = Const.DIR_UP;

    /**
     * 向き有り
     * in: 時計周りの場合の内側の方向
     */
    this.arrows = [
      {dir: Const.DIR_LEFT, in: Const.DIR_UP, enable: false, passed: false},
      {dir: Const.DIR_RIGHT, in: Const.DIR_DOWN, enable: false, passed: false},
    ];

  }

  /**
   * 
   * @param {number} side LEFT or UP 
   * @param {boolean} e0 上または左
   * @param {boolean} e1 下または右
   */
  set(side, e0, e1) {
    this.side = side;
    if (side === Const.DIR_LEFT) {
      this.arrows = [
        new Arrow().init({dir: Const.DIR_DOWN, in: Const.DIR_LEFT, enable: false, passed: false}),
        new Arrow().init({dir: Const.DIR_UP, in: Const.DIR_RIGHT, enable: false, passed: false}),
      ];
    } else {
      this.arrows = [
        new Arrow().init({dir: Const.DIR_LEFT, in: Const.DIR_UP, enable: false, passed: false}),
        new Arrow().init({dir: Const.DIR_RIGHT, in: Const.DIR_DOWN, enable: false, passed: false}),
      ];
    }
    this.arrows[0].enable = e0;
    this.arrows[1].enable = e1;
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
     * @type {Edge[]}
     */
    this.ns = [
      new Edge(),
      new Edge(),
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

        if (j >= 1) { // 左を見る
          const comp = this.dots[index - 1];
          const edge = dot.ns[Const.DIR_LEFT];
          edge.canMove = !dot.eqCols(comp);
          edge.set(Const.DIR_LEFT, (comp.a !== 0), (dot.a !== 0));
        }
        if (i >= 1) { // 上を見る
          const comp = this.dots[index - w];
          const edge = dot.ns[Const.DIR_UP];
          edge.canMove = !dot.eqCols(comp);
          edge.set(Const.DIR_UP, (comp.a !== 0), (dot.a !== 0));
        }

      }
    }

  }

  
  search() {
    const ret = [];
    const w = this.width;
    const h = this.height;
    for (let i = 0; i < h; ++i) {
      for (let j = 0; j < w; ++j) {
        let index = j + w * i;
        /** 開始ドット */
        const firstDot = this.dots[index];

        for (let k = 0; k < 2; ++k) {
          /** 最初の線分 */
          const firstEdge = firstDot.ns[k];
          if (!firstEdge.canMove) {
            continue;
          }

          for (let l = 0; l < 2; ++l) {
            /** 最初の向きつき線分 */
            const firstArrow = firstEdge.arrows[l];
            if (!firstArrow.enable || firstArrow.passed) {
              continue;
            }

            const lp = firstDot.calcLP(firstEdge.side, firstArrow.dir);
            let firstPt = [...lp[0]];
            let secondPt = [...lp[1]];

            // 探し回る
            const route = new Route();
            ret.push(route);
            route.col = firstDot.col;
            route.a = firstDot.a;
            route.pts.push(firstPt);
            route.pts.push(secondPt);

            let neigh = firstArrow;
            neigh.passed = true;
            neigh.ex = secondPt[0];
            neigh.ey = secondPt[1];
            while (true) {
              let x = neigh.ex;
              let y = neigh.ey;

              // 隣接を探す。
              neigh = null;
              // 論理ブロックで外に出ずに同じ色のつながる有向エッジが存在する
              /** @type {any[]} */
              let cands = [
new Arrow().init({dx: x - 1, dy: y, side: Const.DIR_UP, index: 0, ex: x - 1, ey: y, dir: Const.DIR_LEFT}),
new Arrow().init({dx: x, dy: y - 1, side: Const.DIR_LEFT, index: 0, ex: x, ey: y - 1, dir: Const.DIR_UP}),
new Arrow().init({dx: x, dy: y, side: Const.DIR_UP, index: 0, ex: x + 1, ey: y, dir: Const.DIR_RIGHT}),
new Arrow().init({dx: x, dy: y, side: Const.DIR_LEFT, index: 0, ex: x, ey: y + 1, dir: Const.DIR_DOWN}),
              ];

              for (const cand of cands) {
                const edge = this.dots[cand.dx + this.width * cand.dy].ns[cand.side];
                const next0 = edge.arrows[0];
                if (next0.enable && !next0.passed) {
                  if (next0.col === route.col && next0.a === route.a) {
                    neigh = cand;
                  }
                } else {
                  const next1 = edge.arrows[1];
                  if (next1.enable && !next1.passed) {
                    if (next1.col === route.col && next1.a === route.a) {
                      neigh = cand;
                    }
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
    }
    console.log('search', ret);
    return ret;
  }  

}


