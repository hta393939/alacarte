/**
 * @file index.js
 */

import {Db} from '../lib/db.js';

class Misc {
  constructor() {
    this.cur = null;
    this.tunes = null;
    this.db = null;

    this.volume100 = 50;
  }

  async initialize() {
    const sp = new URLSearchParams(location.href);

    this.setListener();

    if (true) {
      const dbinstance = new Db();
      this.db = dbinstance;
      await this.db.init('player_alacarte', 1,
        ['handle', 'parameter']
      );
      console.log('db start');
      const db = await this.db.getDB();

      try {
        // どっちにせよハンドルを要求する
        const result = await this.db.read(db, 'handle', 'first');
        //const result = await db.read('handle', 'key');
        // permission 出てくれるかなあ
        console.log('read', result, result.result.length);
        for (const val of result.result) {
          console.log('val', val);
          const permResult = await this.reqPermission(val.handle)
            .catch(err => {
              console.warn('reqPermission catch', err);
            });
          console.log('permResult', permResult);
          if (permResult) {
            this.dh = val.handle;
          }
        }
      } catch (ec) {
        console.warn('db read', ec);
      }
      await this.db.closeDB(db);

      if (this.dh) {
        this.openDir(this.dh);
      }
    }
  }

  /**
   * プレイヤーにファイルをセットする
   * @param {string} treename 
   * @returns 
   */
  async setTune(treename) {
    /**
     * @type {HTMLAudioElement}
     */
    const el = document.getElementById('main');
    if (!el) {
      return;
    }
    if (el.src) {
      URL.revokeObjectURL(el.src);
      this.currentTree = null;
    }

    const obj = await this.search(treename, 0);
    if (!obj) {
      return;
    }
    const file = await obj.handle.getFile();

    this.starting = treename;
    this.currentTree = treename;
    this.setVolume(this.volume100);
    el.src = URL.createObjectURL(file);
    el.addEventListener('canplaythrough', ev => {
      el.play();
    }, { once: true });

    {
      const info = document.getElementById('tuneinfo');
      if (info) {
        info.textContent = `${obj.name}`;
      }
    }
  }

  /**
   * ボリュームをセットする
   * @param {number} vol100 
   * @returns 
   */
  setVolume(vol100) {
    const el = document.getElementById('main');
    if (!el) {
      return;
    }
    this.volume100 = Math.max(0, Math.min(100, vol100));
    el.volume = this.volume100 / 100;
  }

  /**
   * フォルダを開いて列挙する
   */
  async openDir(dh) {
    const obj = {
      dirs: [],
      files: [],
    };
    await this.enumFile(dh, '', obj);
    // ソートできない???
    obj.files.sort((a, b) => {
      return (a.treename > b.treename) ? 1 : -1;
    });
    console.log('openDir', dh.name, obj);

    await this.listFile(obj);
    this.tunes = obj;

    {
      await this.setTune(obj.files[0].treename);
    }

    {
      const handleobj = {
        key: `__${dh.name}`, // in-line
        name: dh.name,
        handle: dh,
      };
      const db = await this.db.getDB();
      try {
        const result = await this.db.write(db, 'handle', handleobj);
        console.log('write', result);
      } catch (ec) {
        console.warn('db write', ec);
      }
      await this.db.closeDB(db);
    }
  }

  /**
   * リカーシブ
   * @param {FileSystemDirectoryHandle} dh 
   */
  async enumFile(dh, treename, inobj) {
    {
      const obj = {
        treename,
        handle: dh,
      };
      inobj.dirs.push(obj);
    }
    for await (const [name, v] of dh.entries()) {
      if (v.kind === 'directory') {
        await this.enumFile(dh, `${treename}/${name}`, inobj);
        continue;
      }
      const obj = {
        treename: `${treename}/${name}`,
        handle: v,
        name,
      };
      inobj.files.push(obj);
    }
  }

  async clearDB() {
    console.log('clearDB');
    const result = await this.db.clear();
    console.log('clearDB', result);
  }

  /**
   * 
   * @param {{files:any[]}} inobj 
   */
  async listFile(inobj) {
    const parent = document.getElementById('tunelist');
    parent.textContent = '';
    const el = document.getElementById('tunetempl');
    for (const v of inobj.files) {
      const clone = document.importNode(el.content, true);
      {
        const q = clone.querySelector('.tune');
        if (q) {
          q.dataset['treename'] = v.treename;
        }
      }
      {
        const q = clone.querySelector('.name');
        if (q) {
          q.textContent = v.name;
        }
      }
      {
        const q = clone.querySelector('.settune');
        if (q) {
          q.addEventListener('click', async ev => {
            this.setTune(v.treename);
          });
        }
      }
      parent.appendChild(clone);
    }
  }

  /**
   * 
   * @param {string} treename 
   * @param {number} add 
   */
  async search(treename, add) {
    const obj = this.tunes;
    const index = obj.files.findIndex(v => v.treename === treename);
    if (index < 0) {
      return null;
    }
    const num = obj.files.length;
    const found = obj.files[(index + add) % num];
    return found;
  }

  setListener() {
    {
      const el = document.getElementById('opendir');
      el?.addEventListener('click', async () => {
        const opt = { mode: 'read' };
        const dh = await window.showDirectoryPicker(opt);
        this.dh = dh;
        this.openDir(dh);
      });
    }

    {
      const el = document.getElementById('main');
      el?.addEventListener('ended', async (ev) => {
        console.log(ev.type, ev);
        const treename = await this.search(this.currentTree, 1);
        await this.setTune(treename);
      });
    }

    {
      const el = document.getElementById('butup');
      el?.addEventListener('click', () => {
        this.setVolume(this.volume100 + 10);
      });
    }
    {
      const el = document.getElementById('butdown');
      el?.addEventListener('click', () => {
        this.setVolume(this.volume100 - 10);
      });
    }

    {
      const el = document.getElementById('cleardb');
      el?.addEventListener('click', () => {
        this.clearDB();
      });
    }
  }

  /**
   * 
   * @param {FileSystemHandle} h 
   * @param {FileSystemFileHandle} fh
   */
  async reqPermission(h) {
    const opt = { mode: 'read' };
    const res = await h.requestPermission(opt);
    if (res === 'granted') {
      return true;
    }
    return false;
  }

}

const misc = new Misc();
misc.initialize();
