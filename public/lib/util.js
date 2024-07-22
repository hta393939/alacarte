export class Util {
  /**
   * 
   * @param {Blob} blob 
   * @param {string} name 
   */
  static download(blob, name) {
    const a = document.createElement('a');
    a.download = name;
    a.href = URL.createObjectURL(blob);
    a.click();
  }

  static async loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.addEventListener('load', () => {
        resolve(img);
      });
      img.addEventListener('error', (err) => {
        reject(err);
      });
      img.src = url;
    });
  }

  /**
   * 
   * @param {string} url 
   * @param {HTMLCanvasElement} canvas 書き出し先
   */
  static async loadToCanvas(url, canvas) {
    const img = await Util.loadImage(url);
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext('2d');
    c.clearRect(0, 0, w, h);
    c.drawImage(img, 0, 0);
  }

}
