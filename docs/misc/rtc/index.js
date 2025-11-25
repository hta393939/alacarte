
const _pad = (v, n = 2) => {
  return new String(v).padStart(n, '0');
};

class Misc {
  constructor() {
    this.consoles = [];
  }

  async initialize() {
    this.setListener();
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

  async first() {
    const opt = {audio: true, video: true};
    const stream = await navigator.mediaDevices.getUserMedia(opt);
    for (const track of stream.getTracks()) {
      let text = `${track.kind},${track.label},${track.id}`;
      this.log(text);
    }
  }

  async enum() {
    const parent = document.getElementById('devices');
    const devs = await navigator.mediaDevices.enumerateDevices();
    for (const dev of devs) {
      let text = `${dev.kind},${dev.label},${dev.id}`;
      this.log(text);

      if (!parent) {
        continue;
      }
      const el = document.createElement('button');
      el.textContent = `${dev.label}`;
      el.classList.add('pointer', 'largebutton');
      el.addEventListener('click', async ev => {
        const opt = {
          audio: false,
          video: true,
        };
        const stream = await navigator.mediaDevices.getUserMedia(opt);
        let str = `getUserMedia,${stream.id}`;
        this.log(str);
        for (const track of stream.getVideoTracks()) {
          try {
            const capa = await track.getCapabilities();
            this.log(`${JSON.stringify(capa)}`);
          } catch (e) {
            this.log(`${e.message}`);
          }
          try {

          } catch (e) {

          }
        }
      });
    }
  }

  makeFilename(num) {
    return `${this.prefix}${_pad(num, this.num)}.${this.ext}`;
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
      const el = document.getElementById('startbutton');
      el?.addEventListener('click', async () => {
        try {
          await this.first();
        } catch (e) {
          this.log(`first,${e.message}`);
        }
      });
    }
    {
      const el = document.getElementById('enumbutton');
      el?.addEventListener('click', async () => {
        this.enum();
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

}

const misc = new Misc();
misc.initialize();
