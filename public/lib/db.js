
export class Db {
  constructor() {
    //this.db = null;
    /**
     * @type {string}
     */
    this.dbname = null;
    /**
     * @type {number}
     */
    this.dbver = null;
  }

  clear() {
    return new Promise((resolve, reject) => {
      const req = window.indexedDB.deleteDatabase(this.dbname);
      req.addEventListener('blocked', ev => {
        console.log(ev.type, 'clear');
      });
      req.addEventListener('success', ev => {
        console.log(ev.type, ev, req.result); // 成功したら null
        resolve(ev);
      });
      req.addEventListener('error', ev => {
        console.log(ev.type, ev);
        reject(ev);
      });
    });
  }

  /**
   * 
   * @param {string} dbname 
   * @param {number} dbver 
   * @param {string[]} dbstores 
   */
  init(dbname, dbver, dbstores) {
    return new Promise((resolve, reject) => {
      this.dbname = dbname;
      this.dbver = dbver;
      const openreq = window.indexedDB.open(dbname, dbver);
      this.openreq = openreq;
      openreq.addEventListener('upgradeneeded', ev => {
        const db = openreq.result;
        for (const dbstore of dbstores) {
          const store = db.createObjectStore(dbstore, { keyPath: 'key' });
        }
      });
      openreq.addEventListener('success', ev => {
        console.log(ev.type, 'open');
        const db = openreq.result;
        resolve(db);
      });
      openreq.addEventListener('error', ev => {
        console.log(ev.type, 'open');
        reject(ev);
      });
    });
  }

  /**
   * 
   * @param {IDBDatabase} db 
   * @param {string} storename 
   */
  async read(db, storename) {
    const tran = db.transaction([storename]);
    const store = tran.objectStore(storename);
    const req = store.getAll();
    return new Promise((resolve, reject) => {
      req.addEventListener('success', ev => {
        console.log(ev.type, 'read');
        resolve(ev.target);
      });
      req.addEventListener('error', ev => {
        console.log(ev.type, 'error');
        reject(ev);
      });
    });
  }

  /**
   * 
   * @returns {Promise<IDBDatabase>}
   */
  getDB() {
    return new Promise((resolve, reject) => {
      const openreq = window.indexedDB.open(this.dbname);
      openreq.addEventListener('success', ev => {
        const db = openreq.result;
        resolve(db);
      });
      openreq.addEventListener('error', ev => {
        reject(ev);
      });
    });
  }

  /**
   * 
   * @param {IDBDatabase} db 
   */
  async closeDB(db) {
    db.close();
  }

  /**
   * 
   * @param {IDBDatabase} db 
   * @param {string} storename 
   */
  emptyStore(db, storename) {
    // 未実装
    return new Promise((resolve, reject) => {
      const tran = db.transaction(storename, 'readwrite');
      tran.addEventListener('complete', ev => {
        console.log(ev.type, 'empty');
      });
      tran.addEventListener('abort', ev => {
        console.log(ev.type, 'empty');
      });
      tran.addEventListener('error', ev => {
        console.log(ev.type, 'empty');
      });

      const store = tran.objectStore(storename);
      const req = store.clear();
      req.addEventListener('success', ev => {
        console.log(ev.type, ev.target);
        resolve(ev.target);
      });
      req.addEventListener('error', ev => {
        console.log(ev.type, ev.target);

        reject(ev);
      });
    });

  }

  /**
   * 
   * @param {IDBDatabase} db 
   * @param {strng} storename 
   * @param {object} val 
   */
  async write(db, storename, val) {
    return new Promise((resolve, reject) => {
      const tran = db.transaction(storename, 'readwrite');
      tran.addEventListener('complete', ev => {
        console.log(ev.type, 'write');
      });
      tran.addEventListener('abort', ev => {
        console.log(ev.type, 'write');
      });
      tran.addEventListener('error', ev => {
        console.log(ev.type, 'write');
      });

      const store = tran.objectStore(storename);
      const req = store.put(val);
      req.addEventListener('success', ev => {
        console.log(ev.type, ev.target);
        resolve(ev.target);
      });
      req.addEventListener('error', ev => {
        console.log(ev.type, ev.target);

        reject(ev);
      });
    });
  }

}
