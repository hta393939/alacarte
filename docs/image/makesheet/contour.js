

export class Edge {
  /** 0 左 */
  static DIR_LEFT = 0;
  /** 1 上 */
  static DIR_UP = 1;
  static DIR_RIGHT = 2;
  static DIR_DOWN = 3;
  constructor() {
    /** 通行可能かどうか */
    this.canMove = false;

    /**
     * ドットとしての位置
     */
    this.x = 0;
    this.y = 0;
    /** ドットのどちら側か。UP or LEFT */
    this.side = Edge.DIR_UP;

    /**
     * 向き有り
     */
    this.withDirs = [
      {dir: Edge.DIR_LEFT, in: Edge.DIR_UP, enable: false},
      {dir: Edge.DIR_RIGHT, in: Edge.DIR_DOWN, enable: false},
    ];

  }
}


export class Dot {

  constructor() {
    /** 0-255 */
    this.a = 0;
    /** a を含まない 0x00rrggbb */
    this.col = 0;

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

}


export class Route {
  constructor() {
    this.col = 0x000000;
    this.a = 0;

    
  }
}

export class Contour {


  constructor() {
    this.width = 10;
    this.height = 10;

    this.dots = [];
    this.hors = [];
    this.verts = [];
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

        dot.a = a;
        dot.col = Contour.cstoone(r, g, b);

        if (j >= 1) { // 左を見る
          const comp = this.dots(index - 1);
          const edge = dot.ns[Edge.DIR_LEFT];
          edge.canMove = !dot.eqCols(comp);
        }
        if (i >= 1) { // 上を見る
          const comp = this.dots(index - w);
          const edge = dot.ns[Edge.DIR_UP];
          edge.canMove = !dot.eqCols(comp);
        }

      }
    }

  }

  
  search() {
    const w = this.width;
    const h = this.height;
    for (let i = 0; i < h; ++i) {
      for (let j = 0; j < w; ++j) {
        let index = j + w * i;
        const dot = this.dots[index];

        for (let k = 0; k < 2; ++k) {
          const edge = dot.ns[k];
          if (!edge.canMove) {
            continue;
          }

          // 探し回る

        }
      }
    }
  }  

}


