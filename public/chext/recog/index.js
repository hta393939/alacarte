
class Misc {
  constructor() {
    console.log('%c constructor 19:57', Misc.COL);
  }


  async initialize() {
    this.setListener();

    {
      const parent = window.parent;
      parent.postMessage({ type: 'ping' });
    }
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
        const parent = window.parent;
        console.log('parent', parent);
        parent.postMessage({ type: 'reqlist' });
      });
    }

  }

}

const misc = new Misc();
misc.initialize();
