window.funkin = window.funkin || {};
funkin.playCamera = funkin.playCamera || {};

class GameCamera {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
    this.cam = scene.cameras.main;
    this.cam.name = "GameCamera";
    
    funkin.playCamera.game = this.cam;

    this.cam.targetScrollX = this.cam.scrollX;
    this.cam.targetScrollY = this.cam.scrollY;
    this.cam.targetZoom = this.cam.zoom;
    this.cam.lerpFactor = 0.06;

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

    funkin.playCamera.addObjToGame = (obj) => {
      if (funkin.playCamera.ui && obj) funkin.playCamera.ui.ignore(obj);
      if (funkin.playCamera.main && obj) funkin.playCamera.main.ignore(obj);
    };
    funkin.playCamera.addObjToUI = (obj) => {
      if (funkin.playCamera.game && obj) funkin.playCamera.game.ignore(obj);
      if (funkin.playCamera.main && obj) funkin.playCamera.main.ignore(obj);
    };
    funkin.playCamera.addObjToMain = (obj) => {
      if (funkin.playCamera.game && obj) funkin.playCamera.game.ignore(obj);
      if (funkin.playCamera.ui && obj) funkin.playCamera.ui.ignore(obj);
    };
  }

  /**
   * @param {number} intensity
   */
  bop(intensity = 2) {
    if (funkin.play?.options?.simpleMode) return;
    
    if (funkin.playCamera && funkin.playCamera.booping) {
      funkin.playCamera.booping.applyBop(this.cam, intensity);
    } else {
      this.cam.zoom += intensity;
    }
  }

  update() {
    if (funkin.play?.options?.simpleMode) {
      this.cam.scrollX = this.scene.scale.width / 2;
      this.cam.scrollY = this.scene.scale.height / 2;
      this.cam.zoom = 1;
      return;
    }

    this.cam.scrollX += (this.cam.targetScrollX - this.cam.scrollX) * this.cam.lerpFactor;
    this.cam.scrollY += (this.cam.targetScrollY - this.cam.scrollY) * this.cam.lerpFactor;
    this.cam.zoom += (this.cam.targetZoom - this.cam.zoom) * (this.cam.lerpFactor * 1.5);
  }

  destroy() {
    this.cam.setScroll(0, 0);
    this.cam.setZoom(1);
    if (this.cam.clearRenderToTexture) this.cam.clearRenderToTexture();
    
    funkin.playCamera.game = null;
  }
}

funkin.GameCamera = GameCamera;