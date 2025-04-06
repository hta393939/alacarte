
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
    console.log('%c constructor 14:38', Misc.COL);
    this.win = null;
  }

  async initialize() {
    // さすがに無理だった
    globalThis._misc = this;

    this.setListener();

    { // all_frames: false のときはトップフレームのみ
      document.body.dataset['extrecogfoo'] = `foo ${new Date().toLocaleTimeString()}`;
    }
  }

  async send(obj) {
    console.log('%c send', Misc.COL);
    const res = await chrome.runtime.sendMessage(obj);
    console.log('%c res', Misc.COL, res);

    if (this.win) {
      this.win.postMessage(obj, '*');
      console.log('%c send', Misc.COL);
    }
  }

  /** Alt + F1 で起動したい */
  setListener() {
    { /*
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
    */ }

    {
      window.addEventListener('keyup', async (e) => {
        console.log('%c keyup', Misc.COL, e);
        const key = e.key.toLocaleLowerCase();
        if (key === 'f1') {
          if (e.altKey) {
            this.openWindow();
          }
        } else if (key === 'f2') {
          if (e.altKey) {
            const data = await this.search();
            console.log('%c search', Misc.COL, data);
            if (data.vs.length > 0) {
              console.log('%c search', Misc.COL, data.vs.length);
              const recog = await this.readyRecog();
              this.recog = recog;
              const video = data.vs[0].video;
              const stream = video.captureStream();
              await this.startRecog(stream);
            }

            this.send(data);
          }
        }
      });
    }

    {
      const obj = { type: 'ping', param: 'from content' };
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
    this.win = win;

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

  /**
   * 
   * @param {HTMLElement} el 
   */
  async searchIFrame(el, data) {
    if (!el) {
      return;
    }

    try {
      const qs = el.querySelectorAll('iframe');
      const vs = el.querySelectorAll('video');
      for (const v of vs) {
        const obj = {
          type: 'video',
          video: v,
          videoid: v.id,
          videoWidth: v.videoWidth,
          videoHeight: v.videoHeight,
          currentTime: v.currentTime,
          playbackRate: v.playbackRate,
          href: v.src,
          frame: el,
        };
        data.vs.push(obj);
      }
      for (const q of qs) {
        const inner = q.contentWindow;
        // 外から中を見るのはセーフではないのか
        console.log('%c searchIFrame', Misc.COL, inner);
        this.searchIFrame(inner, data);
        console.log('%c searchIFrame done', Misc.COL);
      }

    } catch (e) {
      console.error('%c searchIFrame', Misc.COL, e);
    }

  }

  async search() {
    console.log('%c search', Misc.COL);
    const ret = {
      type: 'reslist',
      href: location.href,
      vs: [],
    };
    this.searchIFrame(document.body, ret);

    console.log('%c search', Misc.COL, ret);
    return ret;
  }


  /**
   * 
   * @param {MediaStream} stream 
   */
  async readyRecog() {
    console.log('readyRecog');
    const recog = new webkitSpeechRecognition();

    recog.addEventListener('start', (ev) => {
      console.log('%c start', Misc.COL, ev.type);
    });
    recog.addEventListener('end', ev => {
      console.log('%c end', Misc.COL, ev.type);

      setTimeout(() => {
        recog.start();
        console.log('%c restart', Misc.COL);
      }
      , 100);
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
      console.log('%c result', Misc.COL, ev.type, ev.results);
    });
    recog.addEventListener('nomatch', ev => {
      console.log(ev.type, ev.results);
    });
    recog.addEventListener('error', ev => {
      console.log(ev.type, ev.error, 'message', ev.message);
      // error = 'no-speech' など
    });

    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = 'ja-JP';

    return recog;
  }

  /**
   * 
   * @param {MediaStream} stream 
   */
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
