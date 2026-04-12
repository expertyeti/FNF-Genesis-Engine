/**
 * @file UICamera.js
 * Configuración de cámara para la Interfaz de Usuario (HUD).
 */

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.data = funkin.play.data || {};
funkin.play.data.camera = funkin.play.data.camera || {};

class UICamera {
  constructor(scene) {
    this.scene = scene;
    const { width, height } = scene.scale;
    
    this.cam = scene.cameras.add(0, 0, width, height);
    this.cam.name = "UICamera";
    this.cam.setScroll(0, 0); 
    
    funkin.play.data.camera.ui = this.cam;

    // CORRECCIÓN: Asignamos al wrapper
    this.targetScrollX = this.cam.scrollX;
    this.targetScrollY = this.cam.scrollY;
    this.targetZoom = 1.0; 
    this.cam.zoom = 1.0;
    this.lerpFactor = 0.08;

    this.cam.bop = (intensity = 0.5) => this.bop(intensity);

    this.cam.pos = {
      get: () => {
        return [this.targetScrollX, this.targetScrollY];
      },
      set: (val) => {
        if (Array.isArray(val) && val.length >= 2) {
          this.targetScrollX = val[0];
          this.targetScrollY = val[1];
        }
      }
    };
  }

  bop(intensity = 2) {
    if (funkin.play.data.camera.booping) {
      funkin.play.data.camera.booping.applyBop(this.cam, intensity);
    } else {
      this.cam.zoom += intensity;
    }
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
    funkin.play.data.camera.ui = null;
  }
}

funkin.play.data.camera.UICamera = UICamera;