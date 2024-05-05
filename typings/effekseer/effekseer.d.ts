/**
 * @file effekseer.d.ts
 */

// https://github.com/effekseer/EffekseerForWebGL/blob/master/src/js/effekseer.src.js

/**
 * 1つのエフェクトインスタンス
 */
declare class EffekseerHandle {
  constructor(context, native);
  stop(): void;
  stopRoot(): void;
/**
 * false のときは再生が終わっている
 */
  get exists(): boolean;
  setFrame(frame: number): void;

  setLocation(x, y, z);
/**
 * オイラー角を指定する
 * @param x 
 * @param y 
 * @param z 
 */
  setRotation(x: number, y: number, z: number): void;
  setScale(x, y, z);
  setMatrix(matrixArray);
  setAllColor(r, g, b, a);
  setTargetLocation(x, y, z);
  getDynamicInput(index): number;
  setDynamicInput(index, value);
/**
 * トリガーを送信する
 * @param index 
 */
  setTrigger(index: number): void;
  setPause(paused: boolean): void;
/**
 * 
 * @param shown false を指定すると不可視になる
 */
  setShown(shown: boolean): void;
/**
 * 
 * @param speed 再生スピード率を指定する
 */
  setSpeed(speed: number): void;
/**
 * 
 * @param seed ランダムシードを指定する
 */
  setRandomSeed(seed: number): void;
}

/**
 * 1種類のエフェクト
 */
declare class EffekseerEffect {
/**
 * 
 * @param context EffekseerContext
 */
  constructor(context);
}

/**
 * コンテキスト
 */
declare class EffekseerContext {
/**
 * 
 * @param {WebGLRenderingContext} webglContext 
 * @param {object} settings 
 */
  init(webglContext, settings): void;
/**
 * フレームを進める
 * @param deltaFrames デフォルトは1
 */
  update(deltaFrames: number): void;
  beginUpdate(): void;
  endUpdate(): void;
  updateHandle(handle, deltaFrames): void;
/**
 * レンダリングする
 */
  draw(): void;
  beginDraw(): void;
  endDraw(): void;
  drawHandle(handle): void;

  loadEffect(data, scale, onload, onerror, redirect);
  loadEffectPackage(data, Unzip, scale, onload, onerror);
  releaseEffect(effect);
/**
 * エフェクトの再生を開始する
 * @param effect 
 * @param x 位置のX成分
 * @param y 
 * @param z 
 */
  play(effect: EffekseerEffect, x: number, y: number, z: number): EffekseerHandle;
  stopAll(): void;
  resetBackground();
}

declare class Effekseer {
/**
 * wasm 版の場合は createContext の前に onload を発火させること。
 * @param path 
 * @param onload 
 * @param onerror 
 */
  initRuntime(path, onload, onerror): void;
/**
 *
 */
  createContext(): EffekseerContext;

  setLogEnabled(flag: boolean): void;

  setImageCrossOrigin(crossOrigin): void;

/**
 * @deprecated
 */
  init(webglContext, settings);
}

declare var effekseer: Effekseer;


