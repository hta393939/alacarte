
class Barcode {
  constructor() {
  }

  initialize() {
    if (!globalThis.BarcodeDetector) {
      globalThis.postMessage({type: 'ready', error: 'Not exist Barcode'});
      return;
    }

    const detector = new globalThis.BarcodeDetector({
      formats: ['qr_code']
    });
    this.detector = detector;
    globalThis.postMessage({type: 'ready'});
  }

  /**
   * ImageBitmap, OffscreenCanvas でもよい
   */
  async detect(data) {
    /** @type {DetectedBarcode[]} */
    const results = await this.detector.detect(data.image);
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

