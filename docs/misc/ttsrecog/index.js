
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

  async speak(text, voice) {
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
        const ret = await this.initSpeech();
        this.speak(text, ret.japan || ret.us);
      });
    }

    const strs = [
      '',
      'ヒトハ',
      'フタバ',
      '三成',
      '四葉',
      'Get ready!',
      '六郎',
      'ななみ',
      '私はやひろです',
      'ここの'
    ];
    for (let i = 0; i < 10; ++i) {
      const el = document.getElementById(`but${String(i).padStart(2, '0')}`);
      el?.addEventListener('click', async (ev) => {

        const ret = await this.initSpeech();
        let voice = ret.japan || ret.us;
        switch (i) {
          case 5:
            voice = ret.multi || ret.us;
            break;
          case 6:
            voice = ret.us || ret.multi;
            break;
          case 7:
            voice = ret.nanami;
            break;
          case 8:
            voice = ret.multi;
            break;
        }
        this.speak(strs[i], voice);
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
    const ret = {};
    for (const v of voices) {
      if (v.lang.startsWith('ja')) {
        jaens.push(v);

        if (!ret.japan?.localService) {
          ret.japan = v;
        }

        if (v.name.includes('七海')) {
          ret.nanami = v;
        }

      } else if (v.lang === 'en-US') {
        jaens.push(v);

        if (!ret.us?.localService) {
          ret.us = v;
        }

        if (v.name.includes('Multi')
          && v.name.includes('Emma')
          //&& v.name.includes('Ava')
        ) {
          ret.multi = v;
        }

      }
    }

    for (const v of jaens) {
      this.log('voice', v.localService, v.name, v.voiceURI);
    }
    return ret;
  }

}

const misc = new Misc();
misc.initialize();
