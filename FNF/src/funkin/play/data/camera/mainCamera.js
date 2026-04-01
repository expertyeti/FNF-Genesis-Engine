/**
 * @file src/funkin/play/data/camera/mainCamera.js
 * Cámara superior para transiciones o elementos Overlays por encima de la UI.
 */

funkin.playCamera = funkin.playCamera || {};

class MainCamera {
    constructor(scene) {
        this.scene = scene;
        const { width, height } = scene.scale;
        
        this.cam = scene.cameras.add(0, 0, width, height);
        this.cam.name = "MainCamera";
        
        funkin.playCamera.main = this.cam;

        this.cam.targetScrollX = this.cam.scrollX;
        this.cam.targetScrollY = this.cam.scrollY;
        this.cam.targetZoom = 1;
        this.cam.lerpFactor = 0.08;

        this.cam.pos = {
            get: () => [this.cam.targetScrollX, this.cam.targetScrollY],
            set: (val) => {
                if (Array.isArray(val) && val.length >= 2) {
                    this.cam.targetScrollX = val[0];
                    this.cam.targetScrollY = val[1];
                }
            }
        };
    }

    update() {
        this.cam.scrollX += (this.cam.targetScrollX - this.cam.scrollX) * this.cam.lerpFactor;
        this.cam.scrollY += (this.cam.targetScrollY - this.cam.scrollY) * this.cam.lerpFactor;
        this.cam.zoom += (this.cam.targetZoom - this.cam.zoom) * (this.cam.lerpFactor * 1.5);
    }

    destroy() {
        if (this.cam) {
            this.scene.cameras.remove(this.cam, true);
        }
        funkin.playCamera.main = null;
    }
}
funkin.MainCamera = MainCamera;