
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
      const el = document.getElementById('startcap');
      el?.addEventListener('click', async () => {
        const stream = await this.startCapture();
        this.stream = stream;
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
    return stream;
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
    const stream = this.stream;
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
      recog.start(); // end の後に再度startする
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
      console.log(ev.type);
      this.processResults(ev.results);
    });
    recog.addEventListener('nomatch', ev => {
      console.log(ev.type, ev.results);
    });
    recog.addEventListener('error', ev => {
      console.log(ev.type, ev.error, 'message', ev.message);
      // error = 'no-speech' など
    });

    recog.language = 'ja-JP';
    //recog.interimResults = true;
    //recog.continuous = true;

    return recog;
  }

  async startRecog() {
    const recog = this.recog;

    const track = await this.getTrack();

    recog.start(track);
    console.log('startRecog');
  }

  async processResults(results) {
    for (const result of results) {
      if (result.confidence == 0) {
        continue; // 信頼度0は無視
      }
      if (!result.isFinal) {
        continue; // 確定していないものは無視
      }
      const transcript = result[0].transcript;
      if (transcript) {
        console.log(result[0].transcript);
      }
    }
  }

}

const misc = new Misc();
misc.initialize();

