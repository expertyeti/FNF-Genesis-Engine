/**
 * Camera configuration for the User Interface (HUD).
 */
class UICamera {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
    const { width, height } = scene.scale;
    
    this.cam = scene.cameras.add(0, 0, width, height);
    this.cam.name = "UICamera";
    this.cam.setScroll(0, 0); 
    
    if (typeof window !== "undefined") {
      window.funkin = window.funkin || {};
      funkin.playCamera = funkin.playCamera || {};
      funkin.playCamera.ui = this.cam;
    }

    this.cam.targetScrollX = this.cam.scrollX;
    this.cam.targetScrollY = this.cam.scrollY;
    this.cam.targetZoom = 1.0; 
    this.cam.zoom = 1.0;
    this.cam.lerpFactor = 0.08;

    this.cam.bop = (intensity = 0.5) => this.bop(intensity);

    this.cam.pos = {
      get: () => {
        return [this.cam.targetScrollX, this.cam.targetScrollY];
      },
      set: (val) => {
        if (Array.isArray(val) && val.length >= 2) {
          this.cam.targetScrollX = val[0];
          this.cam.targetScrollY = val[1];
        }
      }
    };
  }

  /**
   * Delegates the zoom jump to the centralized CameraBooping module
   * @param {number} intensity
   */
  bop(intensity = 2) {
    if (funkin.playCamera && funkin.playCamera.booping) {
      funkin.playCamera.booping.applyBop(this.cam, intensity);
    } else {
      this.cam.zoom += intensity;
    }
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
    if (typeof funkin !== "undefined" && funkin.playCamera) {
      funkin.playCamera.ui = null;
    }
  }
}

if (typeof window !== "undefined") {
  window.funkin = window.funkin || {};
  funkin.UICamera = UICamera;
}