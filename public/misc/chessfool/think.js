
export class Chess {
  static WHITE_IDX = 0;
  static BLACK_IDX = 1;
  static PITCH = 12;

  static PIECE_MASK = 0x07;
  static BLACK_BIT = 0x08;
  static MOVED_BIT = 0x10;

  static EMPTY_BOX = 0x00;
  static WALL_BOX = 0x07;
  //static WALL_BOX = Piece.WALL;

  constructor() {

  }
}

export class Pos {
  constructor(innerx, innery) {
    this.x = 2 + innerx;
    this.y = 2 + innery;
  }
  index() {
    return this.y * Chess.PITCH + this.x;
  }
  clone() {
    const ret = new Pos();
    ret.x = this.x;
    ret.y = this.y;
    return ret;
  }
}

export class Piece {
  static EMPTY = 0;
  static PAWN = 1;
  static ROOK = 2;
  static KNIGHT = 3;
  static BISHOP = 4;
  static QUEEN = 5;
  static KING = 6;
  static WALL = 7;

  static steps = [
    [[Chess.PITCH, Chess.PITCH*2],[Chess.PITCH+1],[Chess.PITCH-1]], // 0 black pawn
    [[-Chess.PITCH, -Chess.PITCH*2], [-Chess.PITCH-1], [-Chess.PITCH+1]], // 1
    [[], [], [], []], // 2
    [[], [], [], [], [], [], [], []], // 3
    [[], [], [], []], // 4
    [[], [], [], [], [], [], [], []], // 5
    [[], [], [], [], [], [], [], []], // 6
    [], // 7
  ];
}

/** 指し手 */
export class Move {
  constructor() {
    this.turn = Chess.BLACK_IDX;
    /** @type {number} */
    this.piece = Piece.EMPTY;
    /** @type {Pos} */
    this.src = new Pos(0, 0);
    /** @type {Pos} */
    this.dst = new Pos(0, 0);
    /** 2つ動いた場合は Piece.PAWN @type {number} */
    this.two = Piece.EMPTY;
    /** 昇格した場合の昇格先 */
    this.promotion = Piece.EMPTY;
    /** キャスリングの場合、Piece.ROOK @type {number} */
    this.castling = Piece.EMPTY;
    this.castlingSrc = new Pos(0, 0);
    this.castlingDst = new Pos(0, 0);
  }

  clone() {
    const ret = new Move();
    ret.turn = this.turn;
    ret.piece = this.piece;
    ret.src = this.src.clone();
    ret.dst = this.dst.clone();
    ret.two = this.two;
    ret.promotion = this.promotion;
    ret.castling = this.castling;
    ret.castlingSrc = this.castlingSrc.clone();
    ret.castlingDst = this.castlingDst.clone();
    return ret;
  }
}

export class Board {
  constructor() {
    /** 現在の盤面 */
    this.buf = new Uint32Array(144);
    /** 直前の指し手 */
    this.preMove = new Move();
  }

  clone() {
    const ret = new Board();
    ret.preMove = this.preMove.clone();
    {
      const src = new Uint8Array(this.buf.buffer);
      const dst = new Uint8Array(ret.buf.buffer);
      dst.set(src);
    }
    return ret;
  }

  initFirst() {
    // 初期画面を作る
    let index = 0;
    for (let y = 0; y < Chess.PITCH; ++y) {
      for (let x = 0; x < Chess.PITCH; ++x) {
        this.buf[index] = Chess.WALL_BOX;
        index += 1;
      }
    }
    for (let y = 4; y < 8; ++y) {
      let offset = y * Chess.PITCH + 2;
      for (let x = 2; x < 10; ++x) {
        this.buf[offset] = Chess.EMPTY_BOX;
        offset += 1;
      }
    }

    const ps = [
      Piece.ROOK, Piece.KNIGHT, Piece.BISHOP, Piece.QUEEN,
      Piece.KING, Piece.BISHOP, Piece.KNIGHT, Piece.ROOK,
    ];
    for (let i = Chess.WHITE_IDX; i <= Chess.BLACK_IDX; ++i) {
      let offset = ((i === Chess.BLACK_IDX) ? 3 : 8) * Chess.PITCH + 2;
      const bit = ((i === Chess.BLACK_IDX) ? Chess.BLACK_BIT : 0);
      const pawn = Piece.PAWN | bit;
      let offsetNonpawn = offset + ((i === Chess.BLACK_IDX) ? -Chess.PITCH : Chess.PITCH);
      for (let j = 0; j < 8; ++j) {
        this.buf[offset] = pawn;
        this.buf[offsetNonpawn] = ps[j] | bit;
        offset += 1;
        offsetNonpawn += 1;
      }
    }
  }

}
