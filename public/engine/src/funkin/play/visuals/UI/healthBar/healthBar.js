class HealthBar {
  constructor(scene) {
    this.scene = scene;
    this.lastBeat = undefined; 

    const getStoredOption = (key) => {
        if (typeof funkin !== 'undefined' && funkin.play && funkin.play.options && funkin.play.options[key] !== undefined) return funkin.play.options[key];
        try {
            const keys = ['genesis_options', 'funkin_options', 'options', 'play_options', 'game_options'];
            for (let i = 0; i < keys.length; i++) {
                let val = localStorage.getItem(keys[i]);
                if (val) {
                    let p = JSON.parse(val);
                    if (p[key] !== undefined) return p[key];
                    if (p.play && p.play.options && p.play.options[key] !== undefined) return p.play.options[key];
                    if (p.options && p.options[key] !== undefined) return p.options[key];
                }
            }
        } catch(e) {}
        if (key === "mobileSchedule") return "arrow";
        return false;
    };

    const isDownscroll = getStoredOption("downscroll") === true;
    const schedule = getStoredOption("mobileSchedule");
    
    // Solo subimos la barra (comportamiento downscroll) si el layout activo modificó las flechas ("arrow")
    const isArrowScheduleActive = window.funkin.mobile && !window.funkin.isKeyboardActive && schedule === "arrow";

    const targetY = isDownscroll || isArrowScheduleActive ? scene.scale.height * 0.11 : scene.scale.height * 0.89;
    const targetX = scene.scale.width / 2;

    const skinData = funkin.play.uiSkins.get("bars.health");
    let bgKeyOriginal = null;

    let healthPath = skinData && skinData.path && skinData.path.trim() !== "" ? skinData.path : "bars/healthBar";
    bgKeyOriginal = funkin.play.uiSkins.getAssetKey(healthPath);

    if (!bgKeyOriginal || !scene.textures.exists(bgKeyOriginal)) {
      if (scene.textures.exists("healthBar")) {
        bgKeyOriginal = "healthBar";
      } else if (window.lastValidHealthBarKey && scene.textures.exists(window.lastValidHealthBarKey)) {
        bgKeyOriginal = window.lastValidHealthBarKey;
      } else {
        bgKeyOriginal = "dummy_health_bar";

        if (!scene.textures.exists(bgKeyOriginal)) {
          const g = scene.add.graphics();
          g.fillStyle(0x000000, 1);
          g.fillRect(0, 0, 600, 19);
          g.lineStyle(4, 0xffffff, 1);
          g.strokeRect(0, 0, 600, 19);
          g.generateTexture(bgKeyOriginal, 600, 19);
          g.destroy();
        }
      }
    }

    if (scene.textures.exists(bgKeyOriginal)) window.lastValidHealthBarKey = bgKeyOriginal;

    const bgKey = funkin.play.visuals.ui.BarExclude.createHollowBar(scene, bgKeyOriginal);
    this.bgSprite = scene.add.sprite(targetX, targetY, bgKey);
    this.bgSprite.setDepth(100);

    const scaleVal = skinData && skinData.scale !== undefined && skinData.scale !== "" ? parseFloat(skinData.scale) : 1;
    this.bgSprite.setScale(scaleVal);

    const innerWidth = (this.bgSprite.width - 8) * scaleVal;
    const innerHeight = (this.bgSprite.height - 8) * scaleVal;

    const startX = this.bgSprite.x - (this.bgSprite.width * scaleVal) / 2 + 4 * scaleVal;
    const startY = this.bgSprite.y - (this.bgSprite.height * scaleVal) / 2 + 4 * scaleVal;

    this.colors = new funkin.play.visuals.ui.BarColors(scene, startX, startY, innerWidth, innerHeight);
    this.colors.bgRect.setDepth(99);
    this.colors.fillRect.setDepth(99);

    this.iconP1 = new funkin.play.visuals.ui.HealthBarIcon(scene, this, true);
    this.iconP2 = new funkin.play.visuals.ui.HealthBarIcon(scene, this, false);

    if (funkin.play.data.camera && funkin.play.data.camera.addObjToUI) {
      funkin.play.data.camera.addObjToUI(this.bgSprite);
      funkin.play.data.camera.addObjToUI(this.colors.bgRect);
      funkin.play.data.camera.addObjToUI(this.colors.fillRect);
      funkin.play.data.camera.addObjToUI(this.iconP1.sprite);
      funkin.play.data.camera.addObjToUI(this.iconP2.sprite);
    }
  }

  update(time, delta) {
    if (!funkin.play || !funkin.play.health) return;

    const getStoredOption = (key) => {
        if (typeof funkin !== 'undefined' && funkin.play && funkin.play.options && funkin.play.options[key] !== undefined) return funkin.play.options[key];
        try {
            const keys = ['genesis_options', 'funkin_options', 'options', 'play_options', 'game_options'];
            for (let i = 0; i < keys.length; i++) {
                let val = localStorage.getItem(keys[i]);
                if (val) {
                    let p = JSON.parse(val);
                    if (p[key] !== undefined) return p[key];
                    if (p.play && p.play.options && p.play.options[key] !== undefined) return p.play.options[key];
                    if (p.options && p.options[key] !== undefined) return p.options[key];
                }
            }
        } catch(e) {}
        if (key === "mobileSchedule") return "arrow";
        return false;
    };

    const isDownscroll = getStoredOption("downscroll") === true;
    const schedule = getStoredOption("mobileSchedule");
    const isArrowScheduleActive = window.funkin.mobile && !window.funkin.isKeyboardActive && schedule === "arrow";
    
    const targetY = isDownscroll || isArrowScheduleActive ? this.scene.scale.height * 0.11 : this.scene.scale.height * 0.89;

    this.bgSprite.y = Phaser.Math.Linear(this.bgSprite.y, targetY, Math.min(1, (delta / 1000) * 12));

    const scaleVal = this.bgSprite.scaleY;
    const startY = this.bgSprite.y - (this.bgSprite.height * scaleVal) / 2 + 4 * scaleVal;

    if (this.colors) {
      this.colors.bgRect.y = startY;
      this.colors.fillRect.y = startY;
    }

    const lerpSpeed = Math.min(1, (delta / 1000) * 8.5);
    funkin.play.health.healthLerp = Phaser.Math.Linear(funkin.play.health.healthLerp, funkin.play.health.health, lerpSpeed);

    const currentHealth = funkin.play.health.healthLerp;

    if (this.colors) this.colors.update(currentHealth);
    if (this.iconP1) this.iconP1.update(currentHealth, delta);
    if (this.iconP2) this.iconP2.update(currentHealth, delta);

    if (funkin.conductor && funkin.conductor.bpm) {
      const bpmValue = typeof funkin.conductor.bpm.get === "function" ? funkin.conductor.bpm.get() : funkin.conductor.bpm;
      const crochet = (60 / bpmValue) * 1000;
      const currentBeat = Math.floor(funkin.conductor.songPosition / crochet);

      if (this.lastBeat === undefined) this.lastBeat = currentBeat;

      if (currentBeat !== this.lastBeat) {
        this.lastBeat = currentBeat;
        if (this.iconP1) this.iconP1.bop();
        if (this.iconP2) this.iconP2.bop();
      }
    }
  }
}

funkin.play.visuals.ui.HealthBar = HealthBar;