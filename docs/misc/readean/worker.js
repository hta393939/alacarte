
class Barcode {
  constructor() {
    this.c = 'color:green;';
  }

  async initialize() {
    try {
      const module = await import('../../third_party/libqrean/Qrean.js');
      if (!module) {
        return;
      }

      globalThis.Qrean = module.Qrean;
      this.qr = new globalThis.Qrean();
      globalThis.postMessage({type: 'ready'});

      console.log('%cinitialize', this.c, globalThis.Qrean, module);
    } catch (e) {
      console.warn('%cinitialize', this.c, e.message);
    }
  }

  /**
   * width, data を持っていること
   */
  async detect(data) {
    try {
      this.qr = new globalThis.Qrean();
      const opt = {
        //outbufSize: 0
      };
      const result = await this.qr.detect(data);
      globalThis.postMessage({type: 'detectresult', result});
    } catch (e) {
      globalThis.postMessage({type: 'detectresult',
        message: e.message,
        result: null});
    }
  }

  onMessage(ev) {
    const data = ev.data;

    switch (data.type) {
      case 'detect':
        this.detect(data);
        break;
    }
  }
}

const barcode = new Barcode();
barcode.initialize();

globalThis.addEventListener('message', ev => {
  barcode.onMessage(ev);
});

