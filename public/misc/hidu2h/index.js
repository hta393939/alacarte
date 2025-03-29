/**
 * @file index.js
 */

class Misc {
  constructor() {
    this.reportID = 3;
  }

  async initialize() {
    this.setListener();

    const dpr = window.devicePixelRatio;
    {
      let s = '';
      s += `${window.innerWidth}`;
      s += `x${window.innerHeight}`;
      const el = window.innerview;
      el.textContent = s;
    }

    this.update();
  }

  update() {
    requestAnimationFrame(() => {
      this.update();
    });

  }

  setListener() {
    window.addEventListener('message', ev => {
      switch(ev.data.type) {
      case 'a':
        break;
      case 'b':
        break;
      case 'c':
        break;
      }
    });

    {
      const el = document.getElementById('opendevice');
      el?.addEventListener('click', async () => {
        const device = await this.openHub();
        this.device = device;
      });
    }

    {
      const el = document.getElementById('getstatus');
      el?.addEventListener('click', async () => {
        await this.getStatus();
      });
    }

    {
      const el = document.getElementById('setstatus');
      el?.addEventListener('click', async () => {
        await this.setStatus();
      });
    }
  }

  async getStatus() {
    const buf = Uint8Array.from([0x5b, 0x02, 0, 0, 0, 0, 0]);
    await this.device?.sendReport(this.reportID, buf);
  }

  async setStatus() {
    const portByte = 5;
    const onOffByte = 1;
    const buf = Uint8Array.from([0x5b, 0, portByte, onOffByte, 0, 0, 0]);
    await this.device?.sendReport(this.reportID, buf); 
  }

  async openHub() {
    const param = {
      filters: [{ vendorId: 0x2101, productId: 8501 }]
    };
    const devices = await navigator.hid.requestDevice(param);
    const device = devices[0];
    if (!device.opened) {
      await device.open();
    }
    device.addEventListener('inputreport', ev => {

    });
    return device;
  }

}

const misc = new Misc();
misc.initialize();



