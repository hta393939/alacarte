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
      filters: [{ vendorId: 0x2101, productId: 0x8501 }]
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

}

const misc = new Misc();
misc.initialize();
