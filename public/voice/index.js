/**
 * @file index.js
 */

class Misc {
  constructor() {
  }

  async initialize() {
    this.setListener();

    {
      let s = '';
      s += `${window.innerWidth}`;
      s += `x${window.innerHeight}`;
      const el = window.innerview;
      el.textContent = s;
    }

    this.enumVoice();
  }

  async enumVoice() {
    const voices = window.speechSynthesis.getVoices();
    for (const voice of voices) {
      if (!voice.lang.toLocaleLowerCase().includes('ja')) {
        continue;
      }
      console.log(voice);
      if (voice.name.toLocaleLowerCase().includes('nanami')) {
        this.selectVoice = voice;
      }
    }
  }

  async say(text) {
    const synth = window.speechSynthesis;
    const utt = new SpeechSynthesisUtterance(text);
    if (this.selectVoice) {
      utt.voice = this.selectVoice;
    }
    synth.speak(utt);
  }

  setListener() {
    {
      const el = document.getElementById('enumvoice');
      el?.addEventListener('click', () => {
        this.enumVoice();
      });
    }

    {
      const el = document.getElementById('saytext');
      el?.addEventListener('click', () => {
        this.say(window.text.value);
      });
    }

    {
      const el = document.getElementById('openwindow');
      el?.addEventListener('click', () => {
        this.openWindow();
      });
    }

    {
      const el = document.getElementById('cap');
      el?.addEventListener('click', () => {
        this.startCapture();
      });
    }
  }

  async startCapture() {
    const opt = {
      audio: true,
      video: true,
    };
    const stream = await navigator.mediaDevices.getDisplayMedia(opt);
    window.mainvideo.srcObject = stream;
    await window.mainvideo.play();
  }

  openWindow() {
    let width = 640;
    let height = 360;
    let hOffset = -1;
    let url = '../player/index.html';
    let feats = [
      //`popup`,
      `width=${width}`,
      `height=${height + hOffset}`,
    ];
    const win = window.open(url,
      //'_blank',
      'corge',
      feats.join(','));
    this.win = win;
  }

}

const misc = new Misc();
misc.initialize();

