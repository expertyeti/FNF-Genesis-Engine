// src/utils/soundtray/soundTrayVisual.js
/**
 * Handles the rendering, tweening and audio feedback of the SoundTray.
 */

window.funkin = window.funkin || {};
funkin.utils = funkin.utils || {};
funkin.utils.soundtray = funkin.utils.soundtray || {};

class SoundTrayVisual {
  constructor() {
    if (!window.hudEventBus) {
      window.hudEventBus = new Phaser.Events.EventEmitter();
    }

    this.scene = null;
    this.trayContainer = null;
    this.barSprite = null;
    this.hideTimer = null;
    this.trayTween = null;

    this.offScreenY = -150;
    this.onScreenY = 10;

    window.hudEventBus.off("init_hud", this.init, this);
    window.hudEventBus.on("init_hud", this.init, this);

    // Validar en caso de que cargue después del GlobalHUDScene
    if (window.game && window.game.scene) {
      const hudScene = window.game.scene.getScene('GlobalHUDScene');
      if (hudScene && hudScene.isHUDInitialized) {
        this.init(hudScene);
      }
    }
  }

  init(scene) {
    if (this.scene) return; // Evitar inicialización doble
    console.log(" Initializing visual plugin...");
    this.scene = scene;

    this.loadAssetsDynamically();

    window.hudEventBus.off("volume_changed", this.onVolumeChanged, this);
    window.hudEventBus.on("volume_changed", this.onVolumeChanged, this);
  }

  loadAssetsDynamically() {
    const BASE_URL = window.BASE_URL || "";
    let needsLoad = false;

    const audioKeys = [
      { key: "vol_down", url: "assets/sounds/soundtray/Voldown.ogg" },
      { key: "vol_up", url: "assets/sounds/soundtray/Volup.ogg" },
      { key: "vol_max", url: "assets/sounds/soundtray/VolMAX.ogg" }
    ];

    audioKeys.forEach((asset) => {
      if (!this.scene.cache.audio.exists(asset.key)) {
        this.scene.load.audio(asset.key, BASE_URL + asset.url);
        needsLoad = true;
      }
    });

    if (!this.scene.textures.exists("volumebox")) {
      this.scene.load.image("volumebox", BASE_URL + "assets/images/ui/soundtray/volumebox.png");
      for (let i = 1; i <= 10; i++) {
        this.scene.load.image(`bars_${i}`, BASE_URL + `assets/images/ui/soundtray/bars_${i}.png`);
      }
      needsLoad = true;
    }

    if (needsLoad) {
      console.log("Downloading assets...");
      this.scene.load.once("complete", () => {
        console.log("Assets downloaded successfully.");
        this.createVisuals();
      });

      if (!this.scene.load.isLoading()) {
        this.scene.load.start();
      }
    } else {
      this.createVisuals();
    }
  }

  createVisuals() {
    if (this.trayContainer) {
      this.trayContainer.destroy();
      this.trayContainer = null;
      this.barSprite = null;
    }

    const centerX = this.scene.scale.width / 2;

    this.trayContainer = this.scene.add.container(centerX, this.offScreenY);
    this.trayContainer.setAlpha(0);
    this.trayContainer.setDepth(999999);
    this.trayContainer.setScrollFactor(0);
    this.trayContainer.setScale(0.65);

    const baseBars = this.scene.add.sprite(0, 15, "bars_10");
    baseBars.setOrigin(0.5, 0);
    baseBars.setAlpha(0.5);

    const bgBox = this.scene.add.sprite(0, 0, "volumebox");
    bgBox.setOrigin(0.5, 0);

    this.barSprite = this.scene.add.sprite(0, 15, "bars_10");
    this.barSprite.setOrigin(0.5, 0);

    this.trayContainer.add([baseBars, bgBox, this.barSprite]);
    console.log("Visual container created.");
  }

  onVolumeChanged(currentVolume, isMuted, action) {
    const hasAudio = this.scene.cache.audio.exists("vol_down");

    if (hasAudio) {
      if (action === "up") {
        if (currentVolume >= 1 && !isMuted) {
          this.scene.game.sound.play("vol_max");
        } else {
          this.scene.game.sound.play("vol_up");
        }
      } else if (action === "down") {
        this.scene.game.sound.play("vol_down");
      }
    } else {
      console.warn("Skipping audio playback, assets not loaded yet.");
    }

    this.showVisualTray(currentVolume, isMuted);
  }

  showVisualTray(currentVolume, isMuted) {
    if (!this.trayContainer || !this.barSprite) return;

    let barLevel = Math.round(currentVolume * 10);

    if (isMuted || currentVolume <= 0.01) {
      barLevel = 0;
    } else if (barLevel === 0 && currentVolume > 0) {
      barLevel = 1;
    }

    if (barLevel > 0) {
      this.barSprite.setVisible(true);
      const textureKey = `bars_${barLevel}`;
      if (this.scene.textures.exists(textureKey)) {
        this.barSprite.setTexture(textureKey);
      }
    } else {
      this.barSprite.setVisible(false);
    }

    if (this.trayTween) this.trayTween.stop();
    
    this.trayTween = this.scene.tweens.add({
      targets: this.trayContainer,
      y: this.onScreenY,
      alpha: 1,
      duration: 150,
      ease: "Sine.easeOut"
    });

    if (this.hideTimer) this.hideTimer.remove();

    this.hideTimer = this.scene.time.delayedCall(1500, () => {
      this.trayTween = this.scene.tweens.add({
        targets: this.trayContainer,
        y: this.offScreenY,
        alpha: 0,
        duration: 250,
        ease: "Sine.easeIn"
      });
    });
  }
}

funkin.utils.soundtray.SoundTrayVisual = SoundTrayVisual;
window.soundTrayVisualPlugin = new funkin.utils.soundtray.SoundTrayVisual();