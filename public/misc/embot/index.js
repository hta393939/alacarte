const _uuid = (s) => {
  return `f7fc${s}-7a0b-4b89-a675-a79137223e2c`;
};
class Em { // 非公式
  constructor() {
    this.bpm = 60;
    this._led = { on: 1, off: 2 };
    this._speed1 = 1;
    this._speed2 = 1;
  }
  async _write(char, val) {
    const buf = new Uint8Array(1);
    buf[0] = Number.parseInt(val);
    await char.writeValueWithoutResponse(buf.buffer);
  }
  async _initialize() {
    const blue = window.navigator.bluetooth;
    try {
      const opt = {
        optionalServices: [ _uuid('e510') ],
        filters: [{ namePrefix: 'EMBOT_' }]
      };
      const device = await blue.requestDevice(opt);
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(_uuid('e510'));
      this._led1 = await service.getCharacteristic(_uuid('e515'));
      this._led2 = await service.getCharacteristic(_uuid('e516'));
      this._servo1 = await service.getCharacteristic(_uuid('e511'));
      this._servo2 = await service.getCharacteristic(_uuid('e512'));
      this._buzzer = await service.getCharacteristic(_uuid('e521'));
      // notify と read が true
      this._other = await service.getCharacteristic(_uuid('e525'));

      console.log('_other', this._other);
    } catch (e) {
      console.error(`_initialize catch`, e.message);
    }
  }
  sleep(sec) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
          resolve();
      }, sec * 1000);
    });
  }
  getDefaultRobotId() { return 'default'; }
  async connectEmbot(id) {}
  logout(arg) { console.warn(eval(arg)); }
  showError(s) { alert(s); }
  rest(sec) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.write(this._buzzer, 0);
        resolve();
      }, sec * 1000);
    });
  }
  async buzzerTimer(beat) { return 60 * beat / this.bpm; }
  async restInOctave(beat) { return 60 * beat / this.bpm; }
  async sendToEmbot(id, info) {
      switch(info.type) {
      case 'led':
        await this._write(info.id === 1 ? this._led1 : this._led2,
          this._led[info.value]);
        break;
      case 'servo':
        await this._write(info.id === 1 ? this._servo1 : this._servo2,
          info.value);
        break;
      case 'rotatingServo':
        if (info.id === 1) {
          this._speed1 = info.value;
        } else {
          this._speed2 = info.value;
        }
        break;
      case 'buzzer': // '61' ラ1
        await this._write(this._buzzer, info.value);
        break;
      case 'octave': // 高い方は100ぐらい 52はド1 28ド-1
        await this._write(this._buzzer, info.value);
        break;
      }
  }
  end() {}

  async _startswitch(char) {
    char.addEventListener('characteristicvaluechanged', (event) => {
      const value = event.target.value.getUint8(0);
      console.log(`${event.type}: ${value}`);
      this.applySwitch(value === 0 ? true : false); // 0: on, 1: off
    });
    await char.startNotifications();
    console.log(`startNotifications success`);

    await char.readValue();
  }

  async action_3() {
    try {
      await this._startswitch(this._other);
    } catch (error) {
      throw error;
    }
  }

  async applySwitch(onoff) {
    const el = document.getElementById('switchview');
    if (!el) {
      return;
    }
    const onoffStr = onoff ? 'on' : 'off';
    el.textContent = `${new Date().toLocaleTimeString()} ${onoffStr}`;

    const robotId = this.getDefaultRobotId();
    const blockInfo = { type: 'led', id: 1, value: onoffStr };
    await this.sendToEmbot(robotId, blockInfo);
  }

}
const em = new Em();
const _start = async () => {
  try {
    await em._initialize();
    await em.action_3();
  } catch (e) {
    em.showError(e.message);
  }
};
