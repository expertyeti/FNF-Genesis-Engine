/**
 * @file public/engine/src/utils/controls/cursors/mobileTouch.js
 * Habilita y fuerza el uso de múltiples punteros (Multitouch) a nivel global en Phaser.
 */

window.funkin = window.funkin || {};
funkin.utils = funkin.utils || {};
funkin.utils.controls = funkin.utils.controls || {};
funkin.utils.controls.cursors = funkin.utils.controls.cursors || {};

class MobileTouch {
  constructor() {
    if (!window.hudEventBus) {
      window.hudEventBus = new Phaser.Events.EventEmitter();
    }

    // Corregido el typo: 'fworceMultitouch' -> 'forceMultitouch'
    window.hudEventBus.on("init_hud", this.forceMultitouch, this);
  }

  forceMultitouch(scene) {
    if (scene && scene.input && scene.input.manager) {
      // Phaser por defecto solo usa 2 (Mouse + 1 Dedo). Agregamos 5 punteros.
      if (scene.input.manager.pointersTotal < 5) {
        scene.input.addPointer(10);
        console.log(
          "[Genesis Engine] Soporte Multitouch forzado globalmente (5 punteros activos).",
        );
      }
    }
  }
}

funkin.utils.controls.cursors.MobileTouch = MobileTouch;

// Auto-inicialización global
if (typeof window !== "undefined") {
  new funkin.utils.controls.cursors.MobileTouch();
}