

export class TexMaker {
  constructor() {

  }

  init() {

  }

  /**
   * 紫系統色
   * @param {HTMLCanvasElement} canvas 
   */
  draw1(canvas) {
    const w = 512;
    const h = 512;
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext('2d');
    const img = c.getImageData(0, 0, w, h);
    for (let y = 0; y < h; ++y) {
      for (let x = 0; x < w; ++x) {
        let hang = Math.PI * 2 * x / w;
        let rateh = 10;
        let k = Math.sin(hang * rateh);
        let r = 128 * ((k + 1) * 0.25 + 0.5);
        let g = 0;
        let b = 255 * ((k + 1) * 0.25 + 0.5);
        let a = 255;

        let ft = (x + w * y) * 4;
        let nx = x / (w - 1) * 2 - 1;
        let ny = y / (h - 1) * 2 - 1;
        if (y < h / 4 || y >= 3 * h / 4) { // 外側
          let ang = Math.PI;
          let hang = Math.PI * 2 * x / w;
          let k2 = (Math.abs(ny) - 0.5) * 2;
          r = 128 * k2 + r * (1 - k2);
          g =   0 * k2 + g * (1 - k2);
          b = 255 * k2 + b * (1 - k2);
        } else { // 内側
          let ang = Math.PI;
        }

        img.data[ft] = r;
        img.data[ft+1] = g;
        img.data[ft+2] = b;
        img.data[ft+3] = a;
      }
    }
    c.putImageData(img, 0, 0);
  }

  /**
   * sha マップ生成
   * @param {HTMLCanvasElement} canvas 
   */
  draw2(canvas) {
    console.log('draw2 called');
    const w = 512;
    const h = 512;
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext('2d');
    c.fillStyle = 'rgb(0, 0, 0)';
    c.fillRect(0, 0, w, h);
    const img = c.getImageData(0, 0, w, h);
    for (let y = 0; y < h; ++y) {
      for (let x = 0; x < w; ++x) {
        let r = 0;
        let g = 0;
        let b = 0;
        let a = 255;

        let ft = (x + w * y) * 4;
        let nx = x / (w - 1) * 2 - 1;
        let ny = y / (h - 1) * 2 - 1;
        let rr = Math.sqrt(nx * nx + ny * ny);

        if (rr <= 1.1) { // 外側
          let lv = 0;
          const ellipses = [
{ cx: 0.1, cy: -0.1, deg: 45, top: 0.5, k: 4, bx: 1, by: 1.2 },
//{ cx: -0.5, cy: 0.5, deg: -45, top: 1/8, k: 2, bx: 1.5, by: 1.5 },
          ];
          for (const ellipse of ellipses) {
            const ang = ellipse.deg * Math.PI / 180;
            const cs = Math.cos(ang);
            const sn = Math.sin(ang);
            let cx = ellipse.cx;
            let cy = ellipse.cy;

            let mx = (nx - cx);
            let my = (ny - cy);
            let dx = mx * cs - my * sn;
            let dy = mx * sn + my * cs;
            dx /= (ellipse.bx || 1);
            dy /= (ellipse.by || 1);

            rr = Math.sqrt(dx * dx + dy * dy);

            let add = ellipse.top - rr * ellipse.k;
            lv += Math.max(0, add);
          }
          {

          }

          lv = Math.max(0, Math.min(255, Math.round(lv * 255)));
          r = lv;
          g = lv;
          b = lv;
        } else {
          r = 128;
          g = 128;
          b = 128;
        }

        img.data[ft] = r;
        img.data[ft+1] = g;
        img.data[ft+2] = b;
        img.data[ft+3] = a;
      }
    }
    c.putImageData(img, 0, 0);
  }

  /**
   * 壁
   * @param {HTMLCanvasElement} canvas 
   */ 
  draw3(canvas) {
    console.log('draw3 called');
    const util = new Util();
    util.srand(1);
    const baseColor = [153, 17, 255];
    const padding = 8;
    const padColor = baseColor.map(c => c * 0.5);
//        const padColor = [0, 0, 0]; // 黒

    const ellipses = [
//{ cx: 1/16, cy: -0.75, deg: 20, top: 1, k: 8, bx: 0.5, by: 0.6, add: true },

{ cx: -3/8, cy: -0.75, deg: -1, top: 1, k: 8, bx: 0.5, by: 8, add: true },
{ cx: 1/8, cy: 0.75, deg: -1, top: 1, k: 8, bx: 0.5, by: 8, add: true },
    ];
    for (let k = 0; k <= 8; ++k) {
      const obj = {
        cx: k / 4 - 1,
        cy: util.rand() / 32768 - 0.5,
        deg: (util.rand() / 32768 - 0.5) * 15,
        top: 1,
        k: 4,
        bx: 0.5 + (util.rand() / 32768 - 0.5) * 0.1,
        by: 6 + (util.rand() / 32768 - 0.5) * 2,
        add: true,
      };
      ellipses.push(obj);
      //console.log(obj);
    }


    const w = 512;
    const h = 512;
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext('2d');
    c.fillStyle = 'rgb(0, 0, 0)';
    c.fillRect(0, 0, w, h);
    const img = c.getImageData(0, 0, w, h);
    for (let y = 0; y < h; ++y) {
      for (let x = 0; x < w; ++x) {
        let r = 0;
        let g = 0;
        let b = 0;
        let a = 255;

        let ft = (x + w * y) * 4;
        let nx = x / (w - 1) * 2 - 1;
        let ny = y / (h - 1) * 2 - 1;
        let rr = Math.sqrt(nx * nx + ny * ny);

        {
          let lv = 0.5;

          for (const ellipse of ellipses) {
            const ang = ellipse.deg * Math.PI / 180;
            const cs = Math.cos(ang);
            const sn = Math.sin(ang);
            let cx = ellipse.cx;
            let cy = ellipse.cy;

            let mx = (nx - cx);
            let my = (ny - cy);
            let dx = mx * cs - my * sn;
            let dy = mx * sn + my * cs;
            dx /= (ellipse.bx || 1);
            dy /= (ellipse.by || 1);

            rr = Math.sqrt(dx * dx + dy * dy);

            let add = ellipse.top - rr * ellipse.k;
            if (ellipse.add) {
              lv += Math.max(0, add);
            } else {
              lv -= Math.max(0, add);
            }
          }

          r = _one255(lv * 153 / 255);
          g = _one255(lv * 17 / 255);
          b = _one255(lv);

          {
            let mx = padding - x;
            let my = padding - y;
            mx = Math.max(mx, x - (w - padding));
            my = Math.max(my, y - (h - padding));
            mx = Math.max(0, mx);
            my = Math.max(0, my);
            const t = Math.min(1, Math.sqrt(mx * mx + my * my) / padding);
            const col = _lerp(padColor, [r, g, b], t, true);
            
            r = col[0];
            g = col[1];
            b = col[2];
          }
        }

        img.data[ft] = r;
        img.data[ft+1] = g;
        img.data[ft+2] = b;
        img.data[ft+3] = a;
      }
    }
    c.putImageData(img, 0, 0);
  }

}
