
import {Board, Piece, Chess} from './think.js';

const _pad = (v, n = 2) => {
  return new String(v).padStart(n, '0');
};

class Misc {
  constructor() {
    this.startcount = 0;
    this.addcount = 1;
    /**
     * 出力数
     */
    this.outcount = 1;
    this.maxcount = -1;
    this.curBoard = new Board();
  }

  async initialize() {
    this.setListener();

    this.readyDraw();
  }


  setListener() {
    {
      const el = document.body;
      el?.addEventListener('dragover', ev => {
        ev.preventDefault();
        ev.stopPropagation();
        ev.dataTransfer.dropEffect = 'none';
      });
      el?.addEventListener('drop', ev => {
        ev.preventDefault();
        ev.stopPropagation();
        ev.dataTransfer.dropEffect = 'none';
      });
    }
    {
      const el = document.querySelector('.drop');
      el?.addEventListener('dragover', ev => {
        ev.stopPropagation();
        ev.preventDefault();
        ev.dataTransfer.dropEffect = 'copy';
      });
      el?.addEventListener('drop', ev => {
        ev.stopPropagation();
        ev.preventDefault();
        //this.analyzeText(ev.dataTransfer.files[0]);
      });
    }

    { // ワーキングディレクトリで指定するタイプ。うまくいく。
      const el = document.getElementById('opendir');
      el?.addEventListener('click', async () => {
        const dirHandle = await this.openDir();
        this.dirHandle = dirHandle;
        await this.processDir(dirHandle);
      });
    }
    { // リトライ
      const el = document.getElementById('retry');
      el?.addEventListener('click', async () => {
        await this.processDir(this.dirHandle);
      });
    }

    for (const k of ['startcount', 'addcount', 'outcount']) {
      const el = document.getElementById(k);
      const _update = () => {
        const val = Number.parseFloat(el.value);
        const viewel = document.getElementById(`${k}view`);
        if (viewel) {
          viewel.textContent = `${val}`;
        }
      };
      el?.addEventListener('input', _update);
      _update();
    }

  }

  readyDraw() {
    const codes = [
      [
        ' ', '\u2659', '\u2656', '\u2658', '\u2657', '\u2655', '\u2654', '-',
      ],
      [
        ' ', '\u265f', '\u265c', '\u265e', '\u265d', '\u265b', '\u265a', '-',
      ]
    ];

    this.curBoard.initFirst();

    /** @type {HTMLCanvasElement} */
    const canvas = document.getElementById('maincanvas');
    const size = 60;
    const w = size * 8;
    const h = size * 8;
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext('2d');
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    let px = size;
    c.font = `normal ${px}px メイリオ`;
    for (let i = 0; i < 8; ++i) {
      for (let j = 0; j < 8; ++j) {
        const isBlack = ((i & 1) + (j & 1)) & 1;
        c.fillStyle = isBlack ? 'rgb(64,0,0' : 'rgb(128,128,0)';
        let x = j * size;
        let y = i * size;
        c.fillRect(x, y, size, size);

        const val = this.curBoard.buf[(2+i) * 10 + (2+j)];
        const black = (val & Chess.BLACK_BIT) ? 1 : 0;
        const piece = (val & Chess.PIECE_MASK);
        c.fillText(codes[black][piece],
          x + size * 0.5, y + size * 0.5);
      }
    }

  }

}

const misc = new Misc();
misc.initialize();
