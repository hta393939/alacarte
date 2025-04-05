
(function() {

class Misc {
  static COL = 'color:#00cc00;';
  constructor() {
    console.log('%c constructor 19:57', Misc.COL);
  }


  async initialize() {
    this.setListener();

    setTimeout(async () => {
      await this.search();
    }, 5000);

    {
      const parent = window.parent;
      parent.postMessage({ type: 'ping' });
    }
  }

  makeList(data) {
    const list = document.createElement('ul');
    for (const item of data) {
      const li = document.createElement('li');
      li.textContent = item;
      list.appendChild(li);
    }
    return list;
  }

  setListener() {
    {
      window.addEventListener('message', (e) => {
        console.log('%c message', Misc.COL, e);
        switch (e.data.type) {
          case 'video':
            console.log('%c recog', Misc.COL, e.data);
            this.makeList(e.data);
            break;
          default:
            break;
        }
      });
    }

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

}

const misc = new Misc();
misc.initialize();

})();
