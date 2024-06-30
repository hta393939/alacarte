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
}
