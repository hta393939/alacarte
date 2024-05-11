/**
 * @file index.js
 */

class Misc {
  constructor() {
  }

  async initialize() {
    this.setListener();
  }

  setListener() {
    const qs = document.querySelectorAll('.live');
    for (const el of qs) {
      const k = el.id;
      const viewel = document.getElementById(`${k}view`);
      const _update = () => {
        const val = Number.parseFloat(el.value);
        this[k] = Number.isFinite(val) ? val : el.value;

        if (viewel) {
          viewel.textContent = this[k];
        }
      };
      el?.addEventListener('input', () => {
        _update();

        if (el.id === 'u1') {
          this.text1 = `${String.fromCodePoint(Number.parseInt(el.value, 16))}`;
        }

        this.redraw();
      });
      _update();
    }

    this.redraw();
  }

  redraw() {
    const w = Number.parseFloat(document.getElementById('w')?.value || 256);
    const h = Number.parseFloat(document.getElementById('h')?.value || 256);
/**
 * @type {HTMLCanvasElement}
 */
    const canvas = document.getElementById('maincanvas');
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext('2d');
    c.textAlign = 'center';
    c.textBaseline = 'middle';

    c.clearRect(0, 0, w, h);

    c.font = `normal ${this.px1}px Consolas`;
    c.fillText(this.text1, w * 0.5 + this.x1, h * 0.5 + this.y1);

    c.font = `normal ${this.px2}px Consolas`;
    c.fillStyle = this.color2;
    c.fillText(this.text2, w * 0.5 + this.x2, h * 0.5 + this.y2);
  }

}

const misc = new Misc();
misc.initialize();

