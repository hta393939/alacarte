import { RotAnim } from "./rotanim.js";
import { FireAnim } from "./fireanim.js";

class Misc {
  init() {
    {
      const el = document.getElementById('makerot');
      el?.addEventListener('click', () => {
        const rotAnim = new RotAnim();
        const text = rotAnim.makeText({rotName: 'chest', sec: 4});
        this.download(new Blob([text]), `radar.xml`);
      });
    }

    {
      const el = document.getElementById('makefire');
      el?.addEventListener('click', () => {
        console.log('makefire clicked');
        const fireAnim = new FireAnim();
        const text = fireAnim.makeText();
        this.download(new Blob([text]), `fighter.xml`);
      });
    }

  }

  /**
   * 
   * @param {Blob} blob 
   * @param {string} name 
   */
  download(blob, name) {
    const a = document.createElement('a');
    a.download = name;
    a.href = URL.createObjectURL(blob);
    a.click();
  }

}

const misc = new Misc();
globalThis.misc = misc;
misc.init();
