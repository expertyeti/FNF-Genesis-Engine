/**
 * @file mainCamera.js
 * Cámara superior para transiciones o elementos Overlays por encima de la UI.
 */

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.data = funkin.play.data || {};
funkin.play.data.camera = funkin.play.data.camera || {};

class MainCamera {
    constructor(scene) {
        this.scene = scene;
        const { width, height } = scene.scale;
        
        this.cam = scene.cameras.add(0, 0, width, height);
        this.cam.name = "MainCamera";
        
        funkin.play.data.camera.main = this.cam;

        // CORRECCIÓN: Asignamos al wrapper
        this.targetScrollX = this.cam.scrollX;
        this.targetScrollY = this.cam.scrollY;
        this.targetZoom = 1;
        this.lerpFactor = 0.08;

        this.cam.pos = {
            get: () => [this.targetScrollX, this.targetScrollY],
            set: (val) => {
                if (Array.isArray(val) && val.length >= 2) {
                    this.targetScrollX = val[0];
                    this.targetScrollY = val[1];
                }
            }
        };
    }

    update() {
        this.cam.scrollX += (this.targetScrollX - this.cam.scrollX) * this.lerpFactor;
        this.cam.scrollY += (this.targetScrollY - this.cam.scrollY) * this.lerpFactor;
        this.cam.zoom += (this.targetZoom - this.cam.zoom) * (this.lerpFactor * 1.5);
    }

    destroy() {
        if (this.cam) {
            this.scene.cameras.remove(this.cam, true);
        }
        funkin.play.data.camera.main = null;
    }
}

funkin.play.data.camera.MainCamera = MainCamera;