// src/utils/soundtray/sountrayLogic.js
/**
 * Orchestrates global volume logic, saving states and capturing inputs.
 */

window.funkin = window.funkin || {};
funkin.utils = funkin.utils || {};
funkin.utils.soundtray = funkin.utils.soundtray || {};

class SoundTrayLogic {
  constructor() {
    if (!window.hudEventBus) {
      window.hudEventBus = new Phaser.Events.EventEmitter();
    }

    this.scene = null;
    this.currentVolume = 0.1;
    this.isMuted = false;

    window.hudEventBus.off("init_hud", this.init, this);
    window.hudEventBus.on("init_hud", this.init, this);

    // Si el script carga tarde y el HUD ya existe, nos auto-inicializamos
    if (window.game && window.game.scene) {
      const hudScene = window.game.scene.getScene('GlobalHUDScene');
      if (hudScene && hudScene.isHUDInitialized) {
        this.init(hudScene);
      }
    }
  }

  async init(scene) {
    if (this.scene) return; // Evitar inicialización doble
    console.log("[SoundTrayLogic] Logic online and listening to buttons");
    this.scene = scene;

    const currentEnv = window.funkin && window.funkin.device && window.funkin.device.get ? window.funkin.device.get() : "web";
    const isMobileOS = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    this.isNativeVolume = currentEnv === "capacitor" || (currentEnv === "web" && isMobileOS);

    if (!this.isNativeVolume) {
      scene.game.sound.pauseOnBlur = false;
      scene.game.loop.pauseOnBlur = false;
    }

    scene.input.keyboard.off("keydown", this.handleInput, this);
    scene.input.keyboard.on("keydown", this.handleInput, this);

    scene.game.events.off("blur", this.onWindowBlur, this);
    scene.game.events.on("blur", this.onWindowBlur, this);

    scene.game.events.off("focus", this.onWindowFocus, this);
    scene.game.events.on("focus", this.onWindowFocus, this);

    try {
      let savedVolume = 1;
      let savedMute = "false";

      if (window.funkin.storage && window.funkin.storage.get) {
        savedVolume = await window.funkin.storage.get("global_volume");
        savedMute = await window.funkin.storage.get("global_mute");
      }

      const parsedVolume = parseFloat(savedVolume);
      this.currentVolume = !isNaN(parsedVolume) ? parsedVolume : 1;
      this.isMuted = savedMute === "true";
    } catch (error) {
      this.currentVolume = 1;
      this.isMuted = false;
    }

    if (scene.game.sound) {
      scene.game.sound.setVolume(this.currentVolume);
      scene.game.sound.mute = this.isMuted;
    }
  }

  onWindowBlur() {
    if (!this.scene) return;

    if (this.isNativeVolume) {
      this.isBlurred = true;
      if (this.scene.game.sound) this.scene.game.sound.mute = true;
    } else {
      this.isBlurred = true;

      if (this.volumeTween) this.volumeTween.stop();
      this.volumeTween = this.scene.tweens.add({
        targets: this.scene.game.sound,
        volume: this.currentVolume * 0.2,
        duration: 500,
        ease: "Sine.easeOut",
      });
    }
  }

  onWindowFocus() {
    if (!this.scene) return;

    if (this.isNativeVolume) {
      this.isBlurred = false;
      if (this.scene.game.sound && !this.isMuted) this.scene.game.sound.mute = false;
    } else {
      this.isBlurred = false;

      if (this.volumeTween) this.volumeTween.stop();
      this.volumeTween = this.scene.tweens.add({
        targets: this.scene.game.sound,
        volume: this.currentVolume,
        duration: 500,
        ease: "Sine.easeIn",
      });
    }
  }

  handleInput(event) {
    if (event.repeat) return;

    if (event.key === "+" || event.code === "NumpadAdd") {
      this.changeVolume(0.1, "up");
    } else if (event.key === "-" || event.code === "NumpadSubtract") {
      this.changeVolume(-0.1, "down");
    } else if (event.key === "0" || event.code === "Numpad0") {
      this.toggleMute();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.scene && this.scene.game.sound) this.scene.game.sound.mute = this.isMuted;

    try {
      if (window.funkin.storage) window.funkin.storage.save("global_mute", this.isMuted.toString());
    } catch (e) {}

    window.hudEventBus.emit("volume_changed", this.currentVolume, this.isMuted, "mute");
  }

  changeVolume(amount, action) {
    let newVol = this.currentVolume + amount;

    if (isNaN(newVol)) newVol = 1;
    newVol = Phaser.Math.Clamp(Math.round(newVol * 10) / 10, 0, 1);

    if (this.isMuted) {
      this.isMuted = false;
      if (this.scene && this.scene.game.sound) this.scene.game.sound.mute = false;
      try {
        if (window.funkin.storage) window.funkin.storage.save("global_mute", "false");
      } catch (e) {}
    }

    this.currentVolume = newVol;

    if (this.scene && this.scene.game.sound) {
      this.scene.game.sound.setVolume(
        this.isBlurred && !this.isNativeVolume ? this.currentVolume * 0.2 : this.currentVolume
      );
    }

    try {
      if (window.funkin.storage) window.funkin.storage.save("global_volume", this.currentVolume.toString());
    } catch (e) {}

    window.hudEventBus.emit("volume_changed", this.currentVolume, this.isMuted, action);
  }
}

funkin.utils.soundtray.SoundTrayLogic = SoundTrayLogic;
window.soundTrayPlugin = new funkin.utils.soundtray.SoundTrayLogic();