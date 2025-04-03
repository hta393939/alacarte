
(function() {

class Misc {
  static COL = 'color:#00cc00;';
  constructor() {
    console.log('%c constructor 19:57', Misc.COL);
  }

  async search() {
    console.log('%c search', Misc.COL);
    const qs = document.querySelectorAll('video');

    let video = null;
    for (const q of qs) {
      const id = q.id;
      console.log('%c video', Misc.COL,
        id, video.playbackRate, video.videoWidth, video.videoHeight, video.currentTime);
      video = q;
    }

    if (!video) {
      console.log('%c no video found', Misc.COL);
      return;
    }

    console.log('%c search', Misc.COL);
  }

  async initialize() {
    this.setListener();

    setTimeout(async () => {
      await this.search();
    }, 5000);
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

  /**
   * 
   * @param {MediaStream} stream 
   */
  async readyRecog() {
    console.log('readyRecog');
    const recog = new webkitSpeechRecognition();
    return recog;
  }

  async startRecog() {
    const recog = this.recog;
    recog.start();
    console.log('startRecog');
  }

}

const misc = new Misc();
misc.initialize();

})();
