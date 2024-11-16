
class Channel {
  targetId = '';
  //targetAttrib = '';
  /**
   * ミリ秒整数
   * @type {number[]}
   */
  keytimes = [];
  //kval = [];
  /**
   * 1次元配列
   * @type {number[]}
   */
  values = [];
  //tangentsIn
  //tangentsOut
  //interpolations
}

class Misc {
  init() {
    {
      const el = document.getElementById('make');
      el?.addEventListener('click', () => {
        this.downloadFile();
      });
    }
  }

  /**
   * keytimes は unsigned int
   */
  downloadFile() {
    {
      /**
       * @type {Channel[]}
       */
      const chs = [];
      const num = 4 * 30;
      for (let i = 0; i < 1; ++i) {
        const ch = new Channel();
        chs.push(ch);

        for (let j = 0; j <= num; ++j) {

          let msec = Math.floor(j * 1000 / 30);
          let q = [0, 0, 0, 1];
          let tick = j / 2; // num で1周
          const ang = Math.PI * 2 * (tick % num) / num;
          let cs = Math.cos(ang);
          let sn = Math.sin(ang);
          if (tick === num * 0.5) {
            cs = -1;
            sn = 0;
          } else if (tick === num * 0.25) {
            cs = 0;
            sn = 1;
          }
          sn = Math.ceil(sn * 10000) / 10000;
          cs = Math.ceil(cs * 10000) / 10000;

          q = [0, sn, 0, cs];

          ch.keytimes.push(msec);
          ch.values.push(...q, 0, 0, 0);
        }

        ch.targetId = 'head';
      }

      const text = this.makeXML(chs);
      this.download(new Blob([text]), `headyrot4.xml`);
    }
  }

  download(blob, name) {
    const a = document.createElement('a');
    a.download = name;
    a.href = URL.createObjectURL(blob);
    a.click();
  }

  /**
   * 
   * @param {Channel[]} chs 
   * @returns 
   */
  makeXML(chs) {
    const rootel = document.createElement('root');
    const asel = document.createElement('Animations');
    asel.setAttribute('id', '__Animations__');

    rootel.appendChild(asel);
    const ael = document.createElement('Animation');
    ael.setAttribute('id', 'animations');
    asel.appendChild(ael);
    for (let i = 0; i < chs.length; ++i) {
      const ch = chs[i];

      const chel = document.createElement('AnimationChannel');
      ael.appendChild(chel);


      const attribel = document.createElement('targetAttrib');
      attribel.textContent = `16 TARGET_ROTATE_TRANSLATE`;
      chel.appendChild(attribel);

      const targetel = document.createElement('targetId');
      targetel.textContent = ch.targetId;
      chel.appendChild(targetel);

      const kel = document.createElement('keytimes');
      kel.setAttribute('count', `${ch.keytimes.length}`);
      kel.textContent = `${ch.keytimes.join(' ')} `;
      chel.appendChild(kel);

      const vel = document.createElement('values');
      vel.setAttribute('count', `${ch.values.length}`);
      vel.textContent = `${ch.values.join(' ')} `;
      chel.appendChild(vel);

      const tinel = document.createElement('tangentsIn');
      tinel.setAttribute('count', `0`);
      chel.appendChild(tinel);

      const toutel = document.createElement('tangentsOut');
      toutel.setAttribute('count', `0`);
      chel.appendChild(toutel);

      const interel = document.createElement('interpolations');
      interel.setAttribute('count', `1`);
      interel.textContent = `${[`1`, ``].join(' ')}`;
      chel.appendChild(interel);
    }

    let str = rootel.outerHTML;
    str = this.replaceTag(str);
    return str;
  }

  replaceTag(intext) {
    let result = intext;
    const pairs = [
      {target: 'Animations'},
      {target: 'Animation'},
      {target: 'AnimationChannel'},
      {target: 'targetAttrib'},
      {target: 'targetId'},
      {target: 'tangentsIn'},
      {target: 'tangentsOut'},
      {target: 'interpolations'},
    ];
    for (const pair of pairs) {
      {
        const search = new RegExp(`<${pair.target.toLocaleLowerCase()}`);
        const rep = `<${pair.target}`;
        result = result.replace(search, rep);
      }
      {
        const search = new RegExp(`</${pair.target.toLocaleLowerCase()}>`);
        const rep = `</${pair.target}>`;
        result = result.replace(search, rep);
      }
    }

    return result;
  }

}

const misc = new Misc();
globalThis.misc = misc;
misc.init();
