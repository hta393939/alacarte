
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
      const opt = {};
      const result = await globalThis.Qrean.detect(data, opt);
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

