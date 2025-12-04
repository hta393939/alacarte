
const _pad = (v, n = 2) => {
  return new String(v).padStart(n, '0');
};

class Misc {
  constructor() {
    this.consoles = [];
  }

  async initialize() {
    this.setListener();

    this.update();
  }

  async log(...args) {
    const d = new Date();
    const text = `${d.toLocaleTimeString()}.${new String(d.getMilliseconds()).padStart(3, '0')},` + args.join(',');
    this.consoles.unshift(text);
    const el = document.getElementById('console');
    if (!el) {
      return;
    }
    const br = document.createElement('br');
    el.insertBefore(br, el.firstChild);
    const node = document.createTextNode(text);
    el.insertBefore(node, el.firstChild);
  }

  makeFilename(num) {
    return `${this.prefix}${_pad(num, this.num)}.${this.ext}`;
  }

  view() {
    const pads = navigator.getGamepads();
    if (!pads) {
      return;
    }
    for (let i = 0; i < pads.length; ++i) {
      const pad = pads[i];
      const el = document.getElementById(`padview${i}`);
      if (!el) {
        continue;
      }
      if (!pad) {
        el.textContent = `null ${i}`;
        continue;
      }
      let str = ``;
      for (let j = 0; j < pad.buttons.length; ++j) {
        str += `${j}${pad.buttons[j].pressed ? 'p' : 'r'}`;
      }
      str += '<br />';
      for (let j = 0; j < pad.axes.length; ++j) {
        let val = pad.axes[j];
        if (j !== 9) {
          str += `,${val.toFixed(6)}`;
        } else {
          str += `,${(Math.round(val * 7) + 7) / 2}`;
        }
        if ((j % 3) === 2) {
          str += '<br />';
        }
      }
      str += `,${pad.id}`;
      el.innerHTML = str;
    }
  }

  update() {
    window.requestAnimationFrame(() => {
      this.update();
    });

    this.view();
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

    {
      window.addEventListener('gamepadconnected', ev => {
        console.log(ev.type, ev.gamepad);
      });
      window.addEventListener('gamepaddisconnected', ev => {
        console.log(ev.type, ev.gamepad);
      });
    }

    {
      const el = document.getElementById('zoomnumber');
      const viewel = document.getElementById('zoomnumberview');
      const _update = ev => {
        const val = Number.parseFloat(el.value);
        if (Number.isFinite(val)) {
          viewel.textContent = `${val}`;
        }
        return val;
      };
      el?.addEventListener('input', _update);
      el?.addEventListener('change', ev => {
        const result = _update();
        if (Number.isFinite(result)) {
          this.setZoom(result);
        }
      });
      _update();
    }

    for (const k of ['startcount', 'addcount', 'outcount']) {
      const el = document.getElementById(k);
      if (!el) {
        continue;
      }
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

}

const misc = new Misc();
misc.initialize();
