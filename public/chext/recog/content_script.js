
(function() {

class Misc {
  static COL = 'color:#00cc00;';
  constructor() {
    console.log('%c constructor 19:57', Misc.COL);
    this.win = null;
  }

  async initialize() {
    this.setListener();
  }

  /** Alt + F1 で起動したい */
  setListener() {
    {
      window.addEventListener('message', async e => {
        console.log('%c message', Misc.COL, e);
        switch (e.data.type) {
          case 'recog':
            console.log('%c recog', Misc.COL, e.data);
            this.startRecog();
            break;
          default:
            break;
        }
      })
    }

    {
      window.addEventListener('keyup', async (e) => {
        console.log('%c keyup', Misc.COL, e);
        const key = e.key.toLocaleLowerCase();
        if (key === 'f1') {
          if (e.altKey) {
            this.openWindow();
          }
        }
      });
    }

  }

  async openWindow() {
    console.log('%c openWindow', Misc.COL);
    let url = chrome.runtime.getURL('index.html');
    const win = window.open(url, 'recog extension', 'width=800,height=600');
    if (!win) {
      alert('ポップアップがブロックされました。');
      return;
    }

    win.focus();
    {
      win.addEventListener('message', e => {
        console.log('%c win message', Misc.COL, e);
      });

      window.addEventListener('message', async e => {
        console.log('%c window message', Misc.COL, e);
        switch (e.data.type) {
          case 'video':
            console.log('%c recog', Misc.COL, e.data);
            this.makeList(e.data);
            break;
          case 'reqlist':
            const ret = await this.search();
            console.log('%c search', Misc.COL, ret);
            win.postMessage(ret);
            break;
          case 'ping':
            console.log('%c ping', Misc.COL, e.data);
            break;
          default:
            break;
        }
      });
    }
  }

  async search() {
    console.log('%c search', Misc.COL);
    const qs = document.querySelectorAll('video');

    const ret = {
      type: 'reslist',
      vs: [],
    };
    let video = null;
    for (const q of qs) {
      const id = q.id;
      console.log('%c video', Misc.COL,
        id, video.playbackRate, video.videoWidth, video.videoHeight, video.currentTime);
      video = q;
      {
        const obj = {
          id: id,
          playbackRate: video.playbackRate,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          currentTime: video.currentTime,
        };
        ret.vs.push(obj);
        console.log('%c video', Misc.COL, obj);
      }
    }

    if (!video) {
      console.log('%c no video found', Misc.COL);
      return;
    }

    console.log('%c search', Misc.COL);
    return ret;
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
