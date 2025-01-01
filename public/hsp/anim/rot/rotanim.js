import { HspAnim, Channel } from "../hspanim.mjs";
  
export class RotAnim extends HspAnim {
  /**
   * API.
   * keytimes は unsigned int
   * @param {string} param.rotName
   * @param {number} param.sec
   */
  makeText(param) {
    {
      /**
       * @type {Channel[]}
       */
      const chs = [];
      const sec = param.sec;
      const num = sec * 30;

      const targets = [
        `root`,
        'hip', 'chest', // 4
        `head`,
      ];

const rel = {
"root": [0.000000, 0.000000, 0.000000,],
"hip": [ 0.000000, 0, 0.000000,],
"chest": [0.000000, 0, 0.000000,],
"head": [0, 0, 0.000000,],
};

      for (let i = 0; i < targets.length; ++i) {
        const ch = new Channel();
        chs.push(ch);

        const targetName = targets[i];
        ch.targetId = targetName;

        const relp = rel[targetName];
        let p = relp ? [...relp] : [0, 0, 0];

        if (targetName !== param.rotName) {
          for (let j = 0; j <= 1; ++j) {
            let msec = Math.floor(j * 1000 * sec);
            let q = [0, 0, 0, 1];
  
            ch.keytimes.push(msec);
            ch.values.push(...q, ...p);
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
          ch.values.push(...q, ...p);
        }

      }

      const text = this.makeXML(chs);
      return text;
    }
  }
  
}
