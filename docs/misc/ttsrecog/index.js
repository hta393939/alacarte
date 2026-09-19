
class Misc {
  constructor() {
    this.cur = null;
    this.tunes = null;

    this.volume100 = 50;

    this.clock = 1;
    this.radius = 1;
    this.lines = [];
  }

  /**
   * 
   * @param {string} str 
   */
  setProcessInfo(str) {
    const el = document.getElementById('processinfo');
    if (!el) {
      return;
    }
    //el.classList.add('');
    el.textContent = `${new Date().toLocaleTimeString()} ${str}`;
  }

  log(...args) {
    console.log(...args);

    const line = args.join(', ');
    this.lines.unshift(line);
    const el = document.getElementById('consoleview');
    if (!el) {
      return;
    }
    el.innerHTML = this.lines.join('<br />');
  }

  async initialize() {
    const sp = new URLSearchParams(location.search);

    this.setListener();

    {
      const voices = window.speechSynthesis.getVoices();
      this.log('first get', voices.length);

      setTimeout(() => {
        this.initSpeech();
      }, 1000);
    }
  }

  /**
   * ボリュームをセットする
   * @param {number} vol100 
   * @returns 
   */
  setVolume(vol100) {
    const el = document.getElementById('main');
    if (!el) {
      return;
    }
    this.volume100 = Math.max(0, Math.min(100, vol100));
    el.volume = this.volume100 / 100;
  }

  setListener() {
    {
      const el = document.getElementById('opendir');
      el?.addEventListener('click', async () => {

      });
    }

    {
      const el = document.getElementById('main');
      el?.addEventListener('ended', async (ev) => {
        console.log(ev.type, ev);
        const result = await this.search(this.currentTree, 1);
        await this.setTune(result?.treename);
      });
    }

    {
      const el = document.getElementById('reaccess');
      el?.addEventListener('click', () => {
        this.reaccess();
      });
    }

    const step = 1 / 8;
    {
      const el = document.getElementById('butup');
      el?.addEventListener('click', () => {
        this.npanner.positionZ.value += -step;
        this.outPos();
      });
    }
    {
      const el = document.getElementById('butdown');
      el?.addEventListener('click', () => {
        this.npanner.positionZ.value += step;
        this.outPos();
      });
    }

    {
      const el = document.getElementById('butleft');
      el?.addEventListener('click', () => {
        this.npanner.positionX.value += -step;
        this.outPos();
      });
    }
    {
      const el = document.getElementById('butright');
      el?.addEventListener('click', () => {
        this.npanner.positionX.value += step;
        this.outPos();
      });
    }

    {
      const el = document.getElementById('butcw');
      el?.addEventListener('click', () => {
        this.clock = (this.clock + 1) % 12;
        this.ring(this.ac, true);
      });
    }
    {
      const el = document.getElementById('butccw');
      el?.addEventListener('click', () => {
        this.clock = (this.clock + 11) % 12;
        this.ring(this.ac, true);
      });
    }
    {
      const el = document.getElementById('butfar');
      el?.addEventListener('click', () => {
        this.radius += step;
        this.ring(this.ac, true);
      });
    }
    {
      const el = document.getElementById('butnear');
      el?.addEventListener('click', () => {
        this.radius += -step;
        this.ring(this.ac, true);
      });
    }

    {
      const el = document.getElementById('replay');
      el?.addEventListener('click', async () => {
        await this.ring(this.ac);
      });
    }

    {
      const el = document.getElementById('cleardb');
      el?.addEventListener('click', async () => {
        await this.emptyStore('parameter').catch(ec => { console.warn('parameter', ec); });
        await this.emptyStore('handle').catch(ec => { console.warn('handle', ec); });
        this.clearDB();
      });
    }

    {
      const el = document.getElementById('startlive');
      el?.addEventListener('click', async () => {
        // ライブ側
        const ac = await this.requestAction();
        this.ac = ac;
        await this.makeNodes(ac);
      });
    }

    {

      /**
       * 
       * @param {string} _type 
       * @returns 
       */
      const _mode = (_type) => {
        return (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          ev.dataTransfer.dropEffect = _type;
        };
      };

      document.body.addEventListener('dragover', _mode('none'));
      const el = document.querySelector('.drop');
      el?.addEventListener('dragover', _mode('link'));
      el?.addEventListener('drop', async ev => {
        _mode('link')(ev);

        await this.readyFile(ev.dataTransfer.files[0]);

        await this.ring(this.ac);
      });
    }

  }

  async initSpeech() {
    const voices = window.speechSynthesis.getVoices();
    const jaens = [];
    for (const v of voices) {
      if (v.lang.startsWith('ja')) {
        jaens.push(v);
      } else if (v.lang.startsWith('en') && v.name.includes('United States')) {
        jaens.push(v);
      }
    }

    for (const v of jaens) {
      this.log('voice', v.localService, v.name, v.voiceURI);
    }

  }

}

const misc = new Misc();
misc.initialize();
