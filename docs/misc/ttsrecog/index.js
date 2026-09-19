
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

  async speak(text) {
    const voice = await this.initSpeech();
    const ut = new SpeechSynthesisUtterance(text);
    ut.voice = voice;
    const d = new Date();
    ut.addEventListener('start', () => {
      this.log('start', Date.now() - d, ut.text);
    });
    this.log('speak', voice.name, ut.text);
    window.speechSynthesis.speak(ut);
  }

  setListener() {
    {
      const el = document.getElementById('speaktext');
      el?.addEventListener('click', async () => {
        const textel = document.getElementById('textvalue');
        const text = textel.value;
        this.speak(text);
      });
    }

    const strs = [
      '',
      'ヒトハ',
      'フタバ',
      '三成',
      '四葉',
      'いつか',
      '六郎',
      'ななみ',
      'やひろ',
      'ここの'
    ];
    for (let i = 0; i < 10; ++i) {
      const el = document.getElementById(`but${String(i).padStart(2, '0')}`);
      el?.addEventListener('click', async (ev) => {
        this.log(ev.type, ev);
        this.speak(strs[i]);
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
    let japan = null;
    let us = null;
    for (const v of voices) {
      if (v.lang.startsWith('ja')) {
        jaens.push(v);

        if (!japan?.localService) {
          japan = v;
        }
      } else if (v.lang.startsWith('en') && v.name.includes('United States')) {
        jaens.push(v);

        if (!us?.localService) {
          us = v;
        }
      }
    }

    for (const v of jaens) {
      this.log('voice', v.localService, v.name, v.voiceURI);
    }

    const voice = japan || us;
    return voice;
  }

}

const misc = new Misc();
misc.initialize();
