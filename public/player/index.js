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

    const db = new Db();
    this.db = db;
    await db.init();
  }

  /**
   * フォルダを開いて列挙する
   */
  async openDir() {
    const opt = { mode: 'read' };
    const dh = await window.showDirectoryPicker(opt);
    this.dh = dh;

    const obj = {
      dirs: [],
      files: [],
    };
    await this.enumFile(dh, '', obj);
    // ソートできない???
    obj.files.sort((a, b) => {
      return (a.treename < b.treename);
    });
    console.log('openDir', dh.name, obj);

    await this.listFile(obj);
    this.tunes = obj;
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
      el?.addEventListener('click', () => {
        this.openDir();
      });
    }

    {
      const el = document.getElementById('main');
      el?.addEventListener('ended', (ev) => {
        console.log(ev.type, ev);
      });
    }
/*
    {
      const el = document.getElementById('openwindow');
      el?.addEventListener('click', () => {
        this.openWindow();
      });
    }*/
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
