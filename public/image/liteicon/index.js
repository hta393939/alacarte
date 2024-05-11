/**
 * @file index.js
 */

class Misc {
  constructor() {
  }

  async initialize() {
    this.setListener();
  }

/**
 * 
 * @param {File} file 
 * @param {HTMLCanvasElement} canvas 
 * @returns {Promise<HTMLCanvasElement>}
 */
  loadFileToCanvas(file, canvas) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.addEventListener('load', () => {
        canvas.width = img.width;
        canvas.height = img.height;
        const c = canvas.getContext('2d');
        c.drawImage(img, 0, 0);
        resolve(canvas);
      });
      img.addEventListener('error', () => {
        reject(`load error`);
      });
      img.src = URL.createObjectURL(file);
    });
  }

  setListener() {
    {
      const el = window;
      el.addEventListener('dragover', ev => {
        ev.preventDefault();
        ev.stopPropagation();
        ev.dataTransfer.dropEffect = 'copy';
      });
      el.addEventListener('drop', async ev => {
        ev.preventDefault();
        ev.stopPropagation();
        ev.dataTransfer.dropEffect = 'copy';
        const canvas = document.getElementById('maincanvas');
        await this.loadFileToCanvas(ev.dataTransfer.files[0], canvas);
        this.convColor(canvas);
      });
    }

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
    c.fillText(this.text2, w * 0.5 + this.x2, h * 0.5 + this.y2);
  }

}

const misc = new Misc();
misc.initialize();



