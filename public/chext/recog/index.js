
class Misc {
  constructor() {
    console.log('constructor 14:28');
  }

  async post(obj) {
    console.log('post');
    const res = await chrome.runtime.sendMessage(
      this.extid, obj);
    console.log('post res', res);
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
    return list;
  }

  setListener() {
    {
      window.addEventListener('message', (e) => {
        console.log('message', e);
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
