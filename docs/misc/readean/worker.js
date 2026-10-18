
class Barcode {
  constructor() {
    this.c = 'color:green;';
  }

  async initialize() {
    console.log('%cinitialize', this.c, location.href, ',', location.search);

    const sp = new URLSearchParams(location.search);
    for (const k of ['barcode']) {
      if (!sp.has(k)) {
        continue;
      }
      let val = sp.get(k) || true;
      this[k] = val;
    }

    if (this.barcode) {
      if (globalThis.BarcodeDetector) {
        console.log('%csupported', globalThis.BarcodeDetector.getSupportedFormats());
        const detector = new globalThis.BarcodeDetector(
          {
            formats: ['qr_code']
          }
        );
        this.detector = detector;
        globalThis.postMessage({type: 'ready', backend: 'native'});
        return;
      }
    }

    try {
      const module = await import('../../third_party/libqrean/Qrean.js');
      if (!module) {
        return;
      }

      globalThis.Qrean = module.Qrean;
      this.qr = new globalThis.Qrean();
      globalThis.postMessage({type: 'ready', backend: 'lib'});

      console.log('%cinitialize', this.c, globalThis.Qrean, module);
    } catch (e) {
      console.warn('%cinitialize', this.c, e.message);
    }
  }

  /**
   * width, data を持っていること
   * @param {ImageData} data
   */
  async detect(data) {
    if (this.detector) {
      try {
        const result = await this.detector.detect(data);
        globalThis.postMessage({type: 'detectresult', result});
      } catch (e) {
        globalThis.postMessage({type: 'detectresult',
          message: e.message,
          result: null});
      }
      return;
    }

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

