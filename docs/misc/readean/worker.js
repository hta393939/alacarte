
class Barcode {
  constructor() {
  }

  async initialize() {
    try {
      const module = await import('../../third_party/libqrean/Qrean.js');
      if (!module) {
        return;
      }

      globalThis.Qrean = module.Qrean;
      globalThis.postMessage({type: 'ready'});
    } catch (e) {
      console.warn('%cinitialize', 'color:green;', e.message);
    }
  }

  /**
   * width, data を持っていること
   */
  async detect(data) {
    try {
      const opt = {};
      const result = await Qrean.decode(data.image, opt);
      globalThis.postMessage({type: 'detectresult', result});
    } catch (e) {
      globalThis.postMessage({type: 'detectresult', result: null});
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

