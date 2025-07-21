/**
 * @file index.js
 */

import {Db} from '../lib/db.js';

class Misc {
  constructor() {
    this.cur = null;
    this.tunes = null;
    this.db = null;
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
    const el = document.getElementById('main');
    if (!el) {
      return;
    }
    if (el.src) {
      URL.revokeObjectURL(el.src);
      el.src = null;
    }

    const obj = this.search(treename);
    if (!obj) {
      return;
    }
    const file = await obj.handle.getFile();

    this.starting = treename;
    el.src = URL.createObjectURL(file);
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
      return (a.treename > b.treename) ? 1 : 0;
    });
    console.log('openDir', dh.name, obj);

    await this.listFile(obj);
    this.tunes = obj;

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
          q.dataset['treename'] = q.treename;
        }
      }
      {
        const q = clone.querySelector('.name');
        if (q) {
          q.textContent = v.name;
        }
      }
      {

      }
      parent.appendChild(clone);
    }
  }

  /**
   * 
   * @param {string} treename 
   */
  async search(treename) {
    const obj = this.tunes;
    const found = obj.files.find(v => v.treename === treename);
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
      el?.addEventListener('ended', (ev) => {
        console.log(ev.type, ev);
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
