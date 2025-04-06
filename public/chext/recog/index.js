
class Misc {
  constructor() {
    console.log('constructor 19:03');
  }

  async post(obj) {
    console.log('post');
    const res = await chrome.runtime.sendMessage(
      this.extid, obj);
    console.log('post res', res);

    const win = window.opener;
    console.log('opener len', win?.length);
    win.postMessage(obj, '*');
    console.log('opener', win, /*win.url*/);
    for (let i = 0; i < win?.length || 0; i++) {
      win[i].postMessage(obj, '*');
    }
  }

  async initialize() {
    this.setListener();

    {
      this.extid = location.host;
      console.log('match', this.extid);
    }

    this.post({ type: 'ping' });
  }

  makeList(data) {
    const { vs } = data;

    const list = document.createElement('ul');
    for (const item of vs) {
      const li = document.createElement('li');
      li.textContent = item;
      list.appendChild(li);
    }
    if (vs.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'no video';
      list.appendChild(li);
    }
    return list;
  }

  setListener() {
    {
      window.addEventListener('message', (e) => {
        console.log('index message', e);
        switch (e.data.type) {
          case 'reslist':
            console.log('reslist', e.data);
            const el = this.makeList(e.data);
            window.videolist.textContent = '';
            window.videolist.appendChild(el);
            break;
          default:
            break;
        }
      });
    }

    {
      const el = document.getElementById('reqlistbut');
      el?.addEventListener('click', () => {
        this.post({ type: 'reqlist' });
      });
    }

  }

}

const misc = new Misc();
misc.initialize();
