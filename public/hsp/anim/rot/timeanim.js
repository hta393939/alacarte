import { HspAnim, Channel } from "../hspanim.mjs";

export class TimeAnim extends HspAnim {
  /**
   * keytimes は unsigned int
   * @override
   */
  makeText() {
    {
      /**
       * @type {Channel[]}
       */
      const chs = [];

      const targets = [
        `root`, 'time', // 2
      ];

const rel = {
"root": [0, 0, 0],
"time": [0, 0, 0],
};

      /**
       * 
       */
      const ks = [
        [
          {t: 0, p: [0, 0, 0]},
          {t: 30 * 1000, p: [0, 0, 0]},
          {t: 60 * 1000, p: [0, 0, 0]},
        ],
        [ // 'time'
          {t: 0,         p: [-1, 1, 0.0]},
          {t: 30 * 1000, p: [ 0, 0, 0.5]},
          {t: 60 * 1000, p: [+1, 1, 1.0]},
        ],
      ];

      for (let i = 0; i < targets.length; ++i) {
        const ch = new Channel();
        chs.push(ch);

        const targetName = targets[i];
        ch.targetId = targetName;

        const index = (targetName === 'time') ? 1 : 0;
        for (const kv of ks[index]) {
          let msec = kv.t;
          let q = [0, 0, 0, 1];
          let p = [...kv.p];

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
