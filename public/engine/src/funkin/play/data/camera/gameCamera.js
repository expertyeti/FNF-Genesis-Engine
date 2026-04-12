/**
 * @file gameCamera.js
 * Cámara principal del juego (sigue a los personajes).
 */

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.data = funkin.play.data || {};
funkin.play.data.camera = funkin.play.data.camera || {};

class GameCamera {
  constructor(scene) {
    this.scene = scene;
    this.cam = scene.cameras.main;
    this.cam.name = "GameCamera";
    
    // Guardamos la referencia de esta cámara globalmente
    funkin.play.data.camera.game = this.cam;

    // CORRECCIÓN: Las variables de objetivo (target) ahora pertenecen a la clase, no al objeto de Phaser.
    this.targetScrollX = this.cam.scrollX;
    this.targetScrollY = this.cam.scrollY;
    this.targetZoom = this.cam.zoom;
    this.lerpFactor = 0.06;

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

    // Funciones de utilidad globales
    funkin.play.data.camera.addObjToGame = (obj) => {
      if (funkin.play.data.camera.ui && obj) funkin.play.data.camera.ui.ignore(obj);
      if (funkin.play.data.camera.main && obj) funkin.play.data.camera.main.ignore(obj);
    };
    funkin.play.data.camera.addObjToUI = (obj) => {
      if (funkin.play.data.camera.game && obj) funkin.play.data.camera.game.ignore(obj);
      if (funkin.play.data.camera.main && obj) funkin.play.data.camera.main.ignore(obj);
    };
    funkin.play.data.camera.addObjToMain = (obj) => {
      if (funkin.play.data.camera.game && obj) funkin.play.data.camera.game.ignore(obj);
      if (funkin.play.data.camera.ui && obj) funkin.play.data.camera.ui.ignore(obj);
    };
  }

  bop(intensity = 2) {
    if (funkin.play && funkin.play.options && funkin.play.options.simpleMode) return;
    
    if (funkin.play.data.camera.booping) {
      funkin.play.data.camera.booping.applyBop(this.cam, intensity);
    } else {
      // El bop modifica la cámara real directamente. Luego el lerp lo devuelve al targetZoom suavemente.
      this.cam.zoom += intensity;
    }
  }

  update() {
    if (funkin.play && funkin.play.options && funkin.play.options.simpleMode) {
      this.cam.scrollX = this.scene.scale.width / 2;
      this.cam.scrollY = this.scene.scale.height / 2;
      this.cam.zoom = 1;
      return;
    }

    // El lerp une suavemente la posición actual con la posición objetivo
    this.cam.scrollX += (this.targetScrollX - this.cam.scrollX) * this.lerpFactor;
    this.cam.scrollY += (this.targetScrollY - this.cam.scrollY) * this.lerpFactor;
    this.cam.zoom += (this.targetZoom - this.cam.zoom) * (this.lerpFactor * 1.5);
  }

  destroy() {
    this.cam.setScroll(0, 0);
    this.cam.setZoom(1);
    if (this.cam.clearRenderToTexture) this.cam.clearRenderToTexture();
    
    funkin.play.data.camera.game = null;
  }
}

funkin.play.data.camera.GameCamera = GameCamera;