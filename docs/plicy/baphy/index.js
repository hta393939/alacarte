
class Misc {
  constructor() {
    this.consoles = [];
    /** カーソル */
    this.c = 0;
  }

  _pad(v, n = 2) {
    return new String(v).padStart(n, '0');
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

  update() {
    window.requestAnimationFrame(() => {
      this.update();
    });


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
        this.onDrop(ev.dataTransfer.files[0]);
      });
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

  gatherParam() {
    const param = {};
    for (const k of ['toply']) {
      const el = document.getElementById(`${k}`);
      if (!el) {
        continue;
      }
      param[k] = el?.checked || false;
    }
    return param;
  }

}

const misc = new Misc();
globalThis.misc = misc;
misc.initialize();
