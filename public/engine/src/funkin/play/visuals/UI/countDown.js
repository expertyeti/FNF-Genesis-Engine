/**
 * @file src/funkin/play/visuals/UI/countDown.js
 */

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.ui = funkin.play.visuals.ui || {};

class CountDown {
  constructor(scene) {
    this.scene = scene;
    this.startSong = true; 
    this.isInCountdown = true;
    this.steps = ["three", "two", "one", "go"];
    this.currentStep = 0;
    this.timer = null;
    this.activeSprites = [];
    this.hasStarted = false; // Bandera añadida
  }

  start() {
    if (!this.startSong) return;

    this.currentStep = 0;
    this.hasStarted = true; // Activa el avance del tiempo en PhaseCountdown
    
    // Resolución segura del chart
    let bpm = 100;
    if (funkin.play && funkin.play.chart && typeof funkin.play.chart.get === "function") {
        bpm = funkin.play.chart.get("metadata.audio.bpm") || 100;
    }
    
    const crochet = (60 / bpm) * 1000;

    if (funkin.conductor) {
        funkin.conductor.songPosition = -(crochet * 4);
    }
    
    if (this.scene.sustainNotesManager) {
        this.scene.tweens.add({
            targets: this.scene.sustainNotesManager,
            globalYOffset: 0,
            duration: 500,
            ease: "Cubic.easeOut"
        });
    }
    
    if (this.scene.notesManager) {
        this.scene.tweens.add({
            targets: this.scene.notesManager,
            globalYOffset: 0,
            duration: 500,
            ease: "Cubic.easeOut"
        });
    }

    this.tick();

    this.timer = this.scene.time.addEvent({
      delay: crochet,
      callback: this.tick,
      callbackScope: this,
      repeat: this.steps.length - 1,
    });
  }

  tick() {
    if (this.currentStep >= this.steps.length) return;

    const stepKey = this.steps[this.currentStep];
    const skinData = funkin.play.uiSkins ? funkin.play.uiSkins.get(`ui.countdown.${stepKey}`) : null;

    if (skinData) {
      if (skinData.audio && skinData.audio.assetPath) {
        const audioKey = funkin.play.uiSkins.getAssetKey(skinData.audio.assetPath);
        if (this.scene.cache.audio.exists(audioKey)) {
          this.scene.sound.play(audioKey, { volume: skinData.audio.volume || 1.0 });
        }
      }

      if (skinData.image && skinData.image.assetPath) {
        const imgKey = funkin.play.uiSkins.getAssetKey(skinData.image.assetPath);

        if (this.scene.textures.exists(imgKey)) {
          // --- APLICAR FILTRO ANTIALIASING ---
          const isAntialiased = typeof funkin.play.uiSkins.getAntialiasing === 'function' ? funkin.play.uiSkins.getAntialiasing() : true;
          const filterMode = isAntialiased ? Phaser.Textures.FilterMode.LINEAR : Phaser.Textures.FilterMode.NEAREST;
          this.scene.textures.get(imgKey).setFilter(filterMode);
          // ------------------------------------

          const centerX = this.scene.scale.width / 2;
          const centerY = this.scene.scale.height / 2;

          const sprite = this.scene.add.sprite(centerX, centerY, imgKey);
          sprite.setOrigin(0.5, 0.5);
          sprite.setDepth(3000);

          if (skinData.image.scale !== undefined) sprite.setScale(skinData.image.scale);
          if (skinData.image.alpha !== undefined) sprite.setAlpha(skinData.image.alpha);

          if (funkin.play && funkin.play.data && funkin.play.data.camera && typeof funkin.play.data.camera.addObjToUI === "function") {
              funkin.play.data.camera.addObjToUI(sprite);
          } else {
              sprite.setScrollFactor(0);
          }

          this.activeSprites.push(sprite);

          let bpm = 100;
          if (funkin.play && funkin.play.chart && typeof funkin.play.chart.get === "function") {
              bpm = funkin.play.chart.get("metadata.audio.bpm") || 100;
          }
          const crochet = (60 / bpm) * 1000;

          this.scene.tweens.add({
            targets: sprite,
            alpha: 0,
            duration: crochet,
            ease: "Cubic.easeInOut",
            onComplete: () => {
              sprite.destroy();
              this.activeSprites = this.activeSprites.filter((s) => s !== sprite);
            },
          });
        }
      }
    }

    this.currentStep++;

    if (this.currentStep >= this.steps.length) {
      let bpm = 100;
      if (funkin.play && funkin.play.chart && typeof funkin.play.chart.get === "function") {
          bpm = funkin.play.chart.get("metadata.audio.bpm") || 100;
      }
      const crochet = (60 / bpm) * 1000;

      this.scene.time.delayedCall(crochet, () => {
        this.finish();
      });
    }
  }

  finish() {
    if (!this.isInCountdown) return;
    this.isInCountdown = false;
    this.scene.events.emit("countdown_finished");
  }

  destroy() {
    if (this.timer) { this.timer.remove(); this.timer = null; }
    this.activeSprites.forEach((sprite) => {
      if (sprite && sprite.active) { this.scene.tweens.killTweensOf(sprite); sprite.destroy(); }
    });
    this.activeSprites = [];
  }
}

funkin.play.visuals.ui.CountDown = CountDown;