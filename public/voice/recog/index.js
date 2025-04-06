
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

    {
      const el = document.getElementById('readyrecogbut');
      el?.addEventListener('click', async () => {
        const recog = await this.readyRecog();
        this.recog = recog;
      });
    }

    {
      const el = document.getElementById('startrecogbut');
      el?.addEventListener('click', () => {
        this.startRecog();
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

  async getTrack() {
    const video = document.getElementById('targetvideo');
    const stream = video.captureStream();
    const track = stream.getAudioTracks()[0];
    return track;
  }

  /**
   * 
   */
  async readyRecog() {
    console.log('readyRecog');
    const recog = new webkitSpeechRecognition();
    //const list = new webkitSpeechGrammerList();
    //list.addFromString('', 1);
    //recog.grammers = list;

    recog.addEventListener('start', (ev) => {
      console.log(ev.type);
    });
    recog.addEventListener('end', ev => {
      console.log(ev.type);
    });

    recog.addEventListener('speechstart', ev => {
      console.log(ev.type);
    });
    recog.addEventListener('soundstart', (ev) => {
      console.log(ev.type);
    });
    recog.addEventListener('audiostart', (ev) => {
      console.log(ev.type);
    });
    recog.addEventListener('result', ev => {
      console.log(ev.type, ev.results);
    });
    recog.addEventListener('nomatch', ev => {
      console.log(ev.type, ev.results);
    });
    recog.addEventListener('error', ev => {
      console.log(ev.type, ev.error, 'message', ev.message);
      // error = 'no-speech' など
    });

    return recog;
  }

  async startRecog() {
    const recog = this.recog;

    const track = await this.getTrack();

    recog.start(track);
    console.log('startRecog');
  }

}

const misc = new Misc();
misc.initialize();

