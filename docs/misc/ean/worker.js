
class Barcode {
  constructor() {
  }

  async initialize() {
    const module = await import('../../third_party/libqrean/Qrean.js');
    if (!module) {
      return;
    }

    globalThis.Qrean = module.Qrean;
    globalThis.postMessage({type: 'ready'});
  }

  /**
   * ImageBitmap, OffscreenCanvas でもよい
   */
  async detect(data) {
    const results = await Qrean.decode(data.image);


    globalThis.postMessage({type: 'detectresult', results});
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

