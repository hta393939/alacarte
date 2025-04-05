
(function() {

/**
 * めんどい。
 * a. やっぱり中に要素を追加する
 *    位置がめんどくてやだなあ
 * b. 開いたwindowとの通信を極める
 *    この知識ももっておきたい気もするが。
 * c. tabId なんとかする
 *    リスト持つ?
 */
class Misc {
  static COL = 'color:#00cc00;';
  constructor() {
    console.log('%c constructor 16:36', Misc.COL);
    this.win = null;
  }

  async initialize() {
    globalThis._misc = this;

    this.setListener();
  }

  async send(obj) {
    console.log('send');
    const res = await chrome.runtime.sendMessage(obj);
    console.log('res', res);
  }

  /** Alt + F1 で起動したい */
  setListener() {
    {
      window.addEventListener('message', async e => {
        console.log('%c global message', Misc.COL, e);
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

    {
      const obj = { type: 'ping' };
      this.send(obj);
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
      const handler = async e => {
        console.log('%c handler message', Misc.COL, e);
        switch (e.data.type) {
          case 'video':
            console.log('%c recog', Misc.COL, e.data);
            this.makeList(e.data);
            break;
          case 'reqlist':
            const ret = await this.search();
            console.log('%c search', Misc.COL, ret);
            win.postMessage(ret, '*');
            break;
          case 'ping':
            console.log('%c ping', Misc.COL, e.data);
            win.postMessage({ type: 'pong' }, '*');
            break;
          default:
            break;
        }
      };

      win.addEventListener('message', handler);
      chrome.runtime.onMessage.addListener(handler);
    }

    {
      win.postMessage({
        type: 'ping',
        param: 'from content',
      }, '*');
      console.log('%c content win', Misc.COL, win, win.url);
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

  async startRecog(stream) {
    const recog = this.recog;
    const track = stream.getAudioTracks()[0];
    recog.start(track);
    console.log('startRecog');
  }

}

const misc = new Misc();
misc.initialize();

})();
