import { HspAnim, Channel } from "../hspanim.mjs";

export class FireAnim extends HspAnim {
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
        `root`, 'body',
        'fire1', 'fire2', 'fire3', // 5
      ];

const rel = {
"root": [0.000000, 0.000000, 0.000000,],
"body": [ 0.000000, 0.000000, 0.000000,],
"fire1": [
 0.000000, 0, -62.5,],
"fire2": [
0, 0, -70+62.5,],
"fire3": [
0, 0, -20.0,]
};

      /**
       * 10秒が0,0,0なのは火を機体内に取り込むため
       */
      const ks = [
        [{t: 0, p: [0, 0, 0]}, {t: 1000, p: [0, 0, 0]}, {t: 10 * 1000, p: [0, 0, 0]}],
        [{t: 0, p: [0, 0, 0]}, {t: 1000, p: [0, 0, 0]}, {t: 10 * 1000, p: [0, 0, 0]}],
        [{t: 0, p: [0, 0, -62.5]}, {t: 1000, p: [0, 0, -62.5]}, {t: 10 * 1000, p: [0, 0, 0]}],
        [{t: 1000, p: [0, 0, -7.5]}, {t: 10 * 1000, p: [0, 0, 0]}],
        [{t: 1000, p: [0, 0, -20]}, {t: 10 * 1000, p: [0, 0, 0]}],
      ];
      // fire2, fire3 かな
      for (let i = 5; i >= 0; --i) {
        let t = Math.floor(i * 1000 / 6);
        {
          const obj = {t, p: [0, 0, -7.5]};
          const offset = [0, -5, 0, -5, 0, -10];
          obj.p[2] += offset[i];
          ks[3].unshift(obj);
        }
        {
          const obj = {t, p: [0, 0, -20]};
          const offset = [0, -5, 0, -5, 0, -20];
          obj.p[2] += offset[i];
          ks[4].unshift(obj);
        }
      }

      for (let i = 0; i < targets.length; ++i) {
        const ch = new Channel();
        chs.push(ch);

        const targetName = targets[i];
        ch.targetId = targetName;

        for (const kv of ks[i]) {
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
