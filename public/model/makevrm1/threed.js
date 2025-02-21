/// <reference path="./index.d.ts" />

'use strict';

class Threed {
    constructor() {
        this.NAME = 'Threed';

        this.basets = Date.now();

        this.baseTex = null;
        this.normalTex = null;
        this.emissTex = null;
        this.occlTex = null;

        this.baseTex2 = null;
        this.normalTex2 = null;
        this.emissTex2 = null;
        this.occlTex2 = null;
    }

    makeControl(dom) {
        const _this = this;

        const control = new THREE.OrbitControls(_this.camera, dom);

        _this.control = control;
    }

    /**
     * three.js メッシュを返す
     */
    /*
    makeMesh() {
        const _this = this;
        console.log(`${_this.NAME}#makeMesh called`);
        {
            _this.packing.makeBuffer();
            const il = new THREE.InterleavedBuffer(_this.packing.buf, _this.packing.attrLen);

            const geo = new THREE.BufferGeometry();
            geo.addAttribute('position', new THREE.InterleavedBufferAttribute(il, 3, 0));
            geo.addAttribute('normal', new THREE.InterleavedBufferAttribute(il, 3, 3));
            geo.addAttribute('uv', new THREE.InterleavedBufferAttribute(il, 2, 6));

            geo.setIndex(new THREE.BufferAttribute(_this.packing.fbuf, 1));

            const mtl = new THREE.MeshStandardMaterial({
                color: 0x80ff80,
                wireframe: true
            });
            const m = new THREE.Mesh(geo, mtl);
            console.log(`${_this.NAME}#makeMesh leave`, m, _this.packing);

            return m;
        }
    }*/

    /**
     * 最終ボーンを計算する
     * @param {{p,q}[]} rots 
     * @param {number} topo 位相
     */
    calcBone(rots, topo) {
        const n = rots.length;
        const obj = new THREE.Object3D();
        for (let i = n - 1; i >= 0; --i) {
                const v = rots[i];

                const q1 = v.q(topo).quaternion;
                obj.position.applyQuaternion(q1);
                obj.position.add(v.p(topo));

                obj.quaternion.multiplyQuaternions(q1, obj.quaternion);
        }
        return obj;
    }


    update() {
        const _this = this;

        const nowts = Date.now();
        const pastts = nowts - _this.basets;

        if (_this.control) {
            _this.control.update();
        }

        {
            const obj = _this.scene.getObjectByName('model');
            if (obj) {
                obj.skeleton.bones[0].rotation.y = pastts * 0.001;
                obj.skeleton.bones[20].rotation.x = pastts * 0.001;
            }
        }

        _this.renderer.render(_this.scene, _this.camera);
    }

    init(vieww, viewh, viewfov) {
        const _this = this;
        console.log(`${_this.NAME}#init called`);
        _this.vieww = vieww;
        _this.viewh = viewh;
        _this.viewfov = viewfov;

        {
            const renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true, preserveDrawingBuffer: true
            });
            renderer.setClearColor(new THREE.Color(0x99ccff), 1);
            renderer.setSize(vieww, viewh);

            const camera = new THREE.PerspectiveCamera(viewfov, vieww/viewh,
                0.01, 10000);
            camera.position.set(0.1, 1.6, 2);
            camera.up.set(0,1,0);
            camera.lookAt(new THREE.Vector3(0, 1.7, 0));
            _this.camera = camera;

            const scene = new THREE.Scene();
            _this.scene = scene;

            {
                const light = new THREE.DirectionalLight(0x999999);
                light.position.set(-1,1, 1);
                scene.add(light);
            }
            {
                const light = new THREE.AmbientLight(0x333333);
                scene.add(light);
            }
            {
                const light = new THREE.DirectionalLight(0x666666);
                scene.add(light);
            }
            {
                const axes = new THREE.AxesHelper(20);
                scene.add(axes);

                const grid = new THREE.GridHelper(10, 10);
                grid.position.set(0, 1, 0);
                scene.add(grid);
            }

            _this.renderer = renderer;

            return renderer.domElement;
        }

    }

    setWire(wire) {
        const _this = this;
        const obj = _this.scene.getObjectByName('model');
        if (obj) {
            obj.material.wireframe = wire;

            console.log(``);
        }
    }

    setVisible(name, visible) {
        const obj = this.scene.getObjectByName(name);
        if (obj) {
            obj.visible = visible;
        }
    }

/**
 * ツリーをフラット配列に変更する
 * @param {THREE.Bone} inroot 
 */
    treeToFlat(inroot) {
        const _this = this;
        const ret = {bones: [], mats: []};
        
        const eigen = new THREE.Matrix4();
        eigen.makeTranslation(0,-1,0);
        console.log(`eigen`, eigen);

        const f = (_bs, _ms, obj)=>{
            _bs.push(obj);
            _ms.push(eigen);

            if ('children' in obj) {
                obj.children.forEach(v=>{
                    f(_bs, _ms, v);
                });
            }
        };

        f(ret.bones, ret.mats, inroot);
        return ret;
    }

    setModel(inurl) {
        const _this = this;
        console.log(`${_this.NAME}#setModel called`);

        const loader = new THREE.VRMLoader();
        loader.load(inurl,
            arg=>{
                console.log(`VRM load done`, arg);
                let c = arg.scene.children;

                let obj = null;
                let bone = null;
                c.forEach(v=>{
                    if (v.name === 'skinnode') {
                        v.name = 'model';
                        obj = v;
                    } else if (v.name !== 'secondary') {
                        bone = v;
                    }
                });

                const vrm = arg.userData.gltfExtensions.VRM;
                //const vrmbones = vrm.humaoid.humanBones;

                const flat = _this.treeToFlat(bone);

                const skeleton = new THREE.Skeleton(flat.bones, flat.mats);
                obj.bind(skeleton);
                obj.add(flat.bones[0]); // これわからん;; けど回すには必要

                _this.scene.add(obj);
                console.log('mats num', flat.mats.length, vrm);
                const helper = new THREE.SkeletonHelper(obj);
                helper.material.linewidth = 2;
                _this.scene.add(helper);

            },
            arg=>{
                //console.log(`load progress`, arg);
            },
            arg=>{
                console.log(`load err`, arg);
            });
    }

} // class Threed
