
/**
 * 左右反転は欲しい。
 * 指などの定番はカプセルでいいかもね。
 */
export class Shape {
  constructor() {
  }

  initialize() {
    const infos = [
      {t0: [0,0,0], scale: 1, deg:[0,0,0], t1:[0,0,0], // t1 はボーンかもしれない
        at: 'leftUpperArm', bt: 'leftLowerArm',
      },
      {t0: [0,0,0], scale: 1, deg:[0,0,0], t1:[0,0,0],

      },
    ];

    this.infos = infos;
  }

  initializeSpecial() {
    const infos = [

    ];
    this.specials = infos;
  }

}

