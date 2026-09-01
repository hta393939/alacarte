
import {Vec3} from "./charbuilder.js";

/**
 * 
 */
export class Util {
  constructor() {
    this.calc();    
  }

  initialize() {
  }

  /**
   * 手首->0 [0.151, -0.619, 0.770] 0.258
   * 0->1 [0.592, -0.687, 0.421] 0.410,
   *   x: [0.592, -0.688, -0.420], z: [0.274, -0.318, 0.908]
   * 1->2 [0.523, -0.851, 0.037] 0.271,
   *   x: [0.522, -0.852, -0.039], z: [0.020, -0.033, 0.999]
   * 2->   offset: [0.138, -0.225, -0.010],
   *   x: [0.522, -0.852, -0.039] z: [0.020, -0.033, 1]
   */
  calc() {
    console.log('calc');

    const bs = [
      {p:[5.147, 12.578, 0.119],
        x:[0.809,-0.516,-0.278],
        z:[0.235,-0.149,0.960],
        top:[0.321, -0.284, 2.086],
      }, // 手首
      {p:[5.186, 12.418, -0.080],
        x:[0.592,-0.687,-0.419],
        z:[0.274,-0.318,0.907]}, // 0、1.0ではない
      {p:[5.429, 12.136, -0.253],
        x:[0.522,-0.851,-0.0387],
        z:[0.020,-0.033,0.999]}, // 1、ほぼ1.0
      {p:[5.571, 11.905, -0.263],
        x:[0.522, -0.851, -0.0387],
        z:[0.020, -0.033, 0.999], // ほぼ1.0
        top:[0.137, -0.224, -0.01],
      }, // 2
    ];
    for (let i = 0; i < bs.length; ++i) {
      const base = bs[i];
      const top = bs[i + 1];
      if (!top) {
        continue;
      }
      const bv = Vec3.fromArray(base.p);
      const bx = Vec3.fromArray(base.x);
      const bz = Vec3.fromArray(base.z);
      const tv = Vec3.fromArray(top.p);
      const diff = tv.clone().subInPlace(bv);
      const len = diff.len();
      const dir = diff.clone().normalizeInPlace();

      console.log('diff, len, dir', diff, len, dir);
      // 0->1, 1->2 は自然
      console.log('dot', dir.dot(bx));
      
      console.log('cross', dir.cross(bz));
    }

  }

}


const util = new Util();
