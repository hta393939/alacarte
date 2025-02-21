/// <reference path="./index.d.ts" />

(function(global_) {

'use strict';

class Vtx {
    /**
     * 頂点1個分
     */
    constructor() {
        this.cl = this.constructor.name;

        this.name = '';

        this.p = new THREE.Vector3();
        /**
         * @type {THREE.Vector3}
         */
        this.n = new THREE.Vector3(0,1,0);
        this.uv = new THREE.Vector2(0.5, 0.5);

        /**
         * ウエイト
         */
        this.wei = new THREE.Vector4(1,0,0,0);
        /**
         * 参照ジョイント
         */
        this.jnt = new THREE.Vector4(0,0,0,0);
    }

    clone() {
        const vtx = new Vtx();
        vtx.name = '' + this.name;
        vtx.p = this.p.clone();
        vtx.n = this.n.clone();
        vtx.uv = this.uv.clone();
        vtx.wei = this.wei.clone();
        vtx.jnt = this.jnt.clone();
        return vtx;
    }

} // class Vtx

if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
        exports = module.exports = Vtx;
    }
    exports.Vtx = Vtx;
} else {
    global_.Vtx = Vtx;
}

})( (this || 0).self || typeof self !== 'undefined' ? self : global );

