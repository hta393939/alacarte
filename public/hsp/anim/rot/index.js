
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
      const sec = 4;
      const num = sec * 30;

      const targets = [
        `head`,
        'XSBone_000', 'hip', 'chest', // 12
        `ude_L_`, `arm_L_`, `momo_L_`, `asi_L_`,
        `ude_R_`, `arm_R_`, `momo_R_`, `asi_R_`,
      ];

      for (let i = 0; i < targets.length; ++i) {
        const ch = new Channel();
        chs.push(ch);

        const targetName = targets[i];
        ch.targetId = targetName;
        if (targetName !== 'head') {
          for (let j = 0; j <= 1; ++j) {
            let msec = Math.floor(j * 1000 * sec);
            let q = [0, 0, 0, 1];
  
            ch.keytimes.push(msec);
            ch.values.push(...q, 0, 0, 0);
          }
          continue;
        }

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

          q = [0, sn, 0, cs];
          q = q.map(v => { const r10 = 10 ** 6; return Math.ceil(v * r10) / r10; });

          ch.keytimes.push(msec);
          ch.values.push(...q, 0, 0, 0);
        }

      }

      const text = this.makeXML(chs);
      this.download(new Blob([text]), `z.xml`);
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

  /**
   * 全部小文字になるので大文字に変換する
   * @param {string} intext 
   * @returns 
   */
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
        const search = new RegExp(`<${pair.target.toLocaleLowerCase()}`, 'g');
        const rep = `<${pair.target}`;
        result = result.replaceAll(search, rep);
      }
      {
        const search = new RegExp(`</${pair.target.toLocaleLowerCase()}>`, 'g');
        const rep = `</${pair.target}>`;
        result = result.replaceAll(search, rep);
      }
    }

    return result;
  }

}

const misc = new Misc();
globalThis.misc = misc;
misc.init();
