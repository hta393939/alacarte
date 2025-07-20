
export class Db {
  constructor() {
    this.db = null;
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
    const req = window.indexedDB.deleteDatabase(this.dbname);
    req.addEventListener('success', ev => {
      console.log(ev.type, ev);
    });
    req.addEventListener('error', ev => {
      console.log(ev.type, ev);
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
        resolve({});
      });
      openreq.addEventListener('error', ev => {
        reject(ev);
      });
    });
  }

  async read() {

  }

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
  async write(db) {
    const tran = db.transaction('store', 'readwrite');
    const store = tran.objectStore('store');
    const req = store.add(value, key);
    req.addEventListener('success', ev => {
      console.log(ev.type, ev.target);
    });
    req.addEventListener('error', ev => {
      console.log(ev.type, ev.target);
    });
  }

}
