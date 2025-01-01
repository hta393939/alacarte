import { RotAnim } from "./rotanim";
import { FireAnim } from "./fireanim";

class Misc {
  init() {
    {
      const el = document.getElementById('make');
      el?.addEventListener('click', () => {
        const rotAnim = new RotAnim();
        const text = rotAnim.makeText();
        this.download(new Blob([text]), `rot.xml`);
      });
    }

    {
      const el = document.getElementById('make');
      el?.addEventListener('click', () => {
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
