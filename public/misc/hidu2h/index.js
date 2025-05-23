/**
 * @file index.js
 */

class Misc {
  constructor() {
    /** U2H のオンオフHIDのためのリポートID */
    this.reportID = 3;
  }

  async initialize() {
    this.setListener();
  }

  setListener() {
    {
      /** @type {HTMLButtonElement} */
      const el = document.getElementById('opendevice');
      el?.addEventListener('click', async () => {
        const device = await this.openHub();
        this.device = device;
        console.log('open success', device);
        el.disabled = true;
      });
    }

    {
      const el = document.getElementById('getstatus');
      el?.addEventListener('click', async () => {
        await this.getStatus();

        console.log('request success');
      });
    }

    {
      const el = document.getElementById('setstatus');
      el?.addEventListener('click', async () => {
        await this.setStatus();

        console.log('set success');
      });
    }

    {
      const el = document.getElementById('openusb');
      el?.addEventListener('click', async () => {
        const device = await this.openUSB();
        console.log('openUSB success', device);
        this.device = device;
      });
    }
  }

  /**
   * 
   * @param {number} sec 
   */
  sleep(sec) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, 1000 * sec);
    });
  }

  /**
   * オンオフ状態要求送信する
   */
  async getStatus() {
    console.log('getStatus');
    const buf = Uint8Array.from([0x5d, 0x02, 0, 0, 0, 0, 0]);
    await this.device?.sendReport(this.reportID, buf);
    console.log('getStatus end');
  }

  /**
   * 
   * @param {boolean} isSet UIへセットするときはtrue
   * @param {DataView?} dv
   */
  checkUI(isSet, dv) {
    const infos = [
      { id: 'port1', index: 5, checked: true, },
      { id: 'port2', index: 2, checked: true, },
      { id: 'port3', index: 3, checked: true, },
      { id: 'port4', index: 4, checked: true, },
    ];
    for (const v of infos) {
      const el = document.getElementById(v.id);
      if (!el) {
        continue;
      }

      if (isSet === false) {
        v.checked = el.checked;
        continue;
      }
      /** 0b 00 xx xx 11 */
      const u8 = dv.getUint8(1);
      const bit = u8 & (1 << v.index);
      el.checked = bit;
    }
    return infos;
  }

  /**
   * UI から取得してセットする
   */
  async setStatus() {
    const infos = this.checkUI(false);
    console.log('setStatus', infos);
    for (const v of infos) {
      const portByte = v.index;
      const onOffByte = v.checked ? 1 : 0;
      const buf = Uint8Array.from([0x5d, 0, portByte, onOffByte, 0, 0, 0]);
      await this.device?.sendReport(this.reportID, buf); 
      await this.sleep(1);
    }
    console.log('setStatus end');
  }

  /**
   * U2H-SW4S を開く
   * 
   * @returns 
   */
  async openHub() {
    const param = {
//      filters: [{ vendorId: 0x2101, productId: 0x8501 }]
      filters: []
    };
    const devices = await navigator.hid.requestDevice(param);
    const device = devices[0];
    if (device.opened) {
      console.log('already open');
    } else {
      await device.open();
      console.log('open success');
    }
    device.addEventListener('inputreport', ev => {
      console.log(ev.type, ev.data);
      this.checkUI(true, ev.data);
    });
    return device;
  }

  async openUSB() {
    const param = {
//      filters: [{ vendorId: 0x0408, productId: 0x3047 }]
      filters: []
    };
    const device = await navigator.usb.requestDevice(param);
    if (device.opened) {
      console.log('already usb open');
    } else {
      await device.open();
      console.log('open usb success');
    }

    // NIKON DSC COOLPIX S1100pj-PCD

    // @see http://www.chokanji.com/developer/doc/brightv.r4/device/usbmgr.html
    // Quanta なにこれw
    // デバイスクラス 239 0xEF Miscellaneous
    // interface 2つ endpoint in(デバイスからホストへ) 
    // 1. packetSize 16 interrupt
    //    14-1
    // 2. 0 0個 代替インターフェース
    //    1 in iso 128 
    //    2 in iso 512
    //    3 in iso 1024
    //    4 in iso 2816
    //    5 in iso 3072
    //    6 in iso 4992
    //    7 in iso 5116
    // interface class 14-2 interface protocol 0

    return device;
  }

}

const misc = new Misc();
misc.initialize();
