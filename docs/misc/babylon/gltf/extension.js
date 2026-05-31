
/**
 * @see https://doc.babylonjs.com/typedoc/interfaces/BABYLON.GLTF2.IGLTFLoaderExtension
 */
class FooExtension {
  static name = 'VRMC_vrm';

  constructor(loader) {
    this.enabled = true;
    /** VRM0.0 */
    //this.name = 'VRM';
    this.name = FooExtension.name;
    //this.name = 'VRMC_springBone';
    //this.name = 'VRMC_node_constraint';
    //this.name = 'VRMC_materials_mtoon';
    /** @type {number?} */
    this.order = 100;

    this._loader = loader;

    const options = loader.parent.extensionOptions[this.name];
    console.log('options', options, loader);
    this._options = options;
  }

  /**
   * 
   * @param {string} context 
   * @param {*BABYLON.GLTF2.Loader.IMaterial} material 
   * @param {number} babylonDrawMode 
   */
  /*
  createMaterial(context, material, babylonDrawMode) {
    return null;
  } */

  dispose() {
    console.log('dispose');
  }

  /**
   * 
   * @param {string} context '/scenes/0' など
   * @param {BABYLON.Scene} scene 
   */
  async loadSceneAsync(context, scene) {
    console.log('loadSceneAsync', context, scene);

    // TODO: 標準ローダー呼び出しはどうするの??
    return;
  }

  onLoading() {
    console.log('onLoading', this._loader);
  }

  onReady() {
    console.log('onReady', this._loader);
  }

}


/*
BABYLON.GLTF2.registerGLTFExtension(FooExtension.name, true, async loader => {
  console.log('factory');
  return new FooExtension(loader);
});
*/
