/**
 * Main scene for Story Mode.
 * @extends Phaser.Scene
 */
class StoryModeScene extends Phaser.Scene {
  constructor() {
    super({ key: "StoryModeScene" });
    this.canInteract = false;
    this.beatTimer = null; 
  }

  preload() {
    if (!this.cache.audio.exists("scrollMenu")) this.load.audio("scrollMenu", "public/sounds/scrollMenu.ogg");
    if (!this.cache.audio.exists("confirmMenu")) this.load.audio("confirmMenu", "public/sounds/confirmMenu.ogg");
    if (!this.textures.exists("tracks_image")) this.load.image("tracks_image", "public/images/menu/storymode/Tracks.png");
    if (!this.textures.exists("storymode_arrows")) {
      this.load.atlasXML("storymode_arrows", "public/images/menu/storymode/arrows.png", "public/images/menu/storymode/arrows.xml");
    }

    const difficulties = ["easy", "normal", "hard"];
    difficulties.forEach((diff) => {
      if (!this.textures.exists(`difficulty_${diff}`)) {
        this.load.image(`difficulty_${diff}`, `public/images/menu/storymode/difficults/${diff}.png`);
      }
    });
  }

  create() {
    this.events.on("shutdown", this.cleanUp, this);

    if (!this.sound.get("freakyMenu") && this.cache.audio.exists("freakyMenu")) {
      this.sound.add("freakyMenu");
    }
    const music = this.sound.get("freakyMenu");

    if (music && !music.isPlaying) music.play({ loop: true, volume: 1 });
    else if (music && music.isPlaying && music.volume < 1) {
      this.tweens.add({ targets: music, volume: 1, duration: 1000 });
    }

    if (funkin.conductor) funkin.conductor.bpm.set(102);

    this.setupBeatTimer();
    if (funkin.conductorEvents) funkin.conductorEvents.on("bpm_changed", this.setupBeatTimer, this);
    window.storyModeEventBus.removeAllListeners();

    window.globalStoryModeData = new window.StoryModeData();
    this.dataManager = window.globalStoryModeData;

    this.dataManager.loadWeeksData(this).then(() => {
      this.buildUI();
    });
  }

  setupBeatTimer() {
    if (this.beatTimer) this.beatTimer.destroy();
    const beatDelay = funkin.conductor ? funkin.conductor.crochet : 588.23;
    this.beatTimer = this.time.addEvent({
      delay: beatDelay,
      loop: true,
      callback: this.onBeatHit,
      callbackScope: this,
    });
  }

  onBeatHit() {
    if (this.canInteract && this.characterPropsManager) {
      this.characterPropsManager.dance();
    }
  }

  buildUI() {
    if (window.StoryModeProps) {
      this.propsManager = new window.StoryModeProps(this);
      this.propsManager.buildBackground(this.dataManager.getCurrentWeek());
    }

    if (window.StoryModeTitles) this.titlesManager = new window.StoryModeTitles(this, this.dataManager);
    if (window.StoryModeTracks) this.tracksManager = new window.StoryModeTracks(this, this.dataManager);
    if (window.StoryModeDifficulty) this.difficultyManager = new window.StoryModeDifficulty(this, this.dataManager);
    if (window.StoryModeCharacterProps) this.characterPropsManager = new window.StoryModeCharacterProps(this, this.dataManager);

    if (window.StoryModeUpBar) {
      this.upBar = new window.StoryModeUpBar(this);
      const diffStr = this.dataManager.getCurrentDifficultyName() || "normal";
      this.upBar.updateWeekData(this.dataManager.getCurrentWeek(), diffStr);
    }

    this.inputHandler = new window.StoryModeInput(this);

    window.storyModeEventBus.on("go_back", this.goBack, this);
    window.storyModeEventBus.on("change_week", this.changeWeek, this);
    window.storyModeEventBus.on("change_difficulty", this.onDifficultyChanged, this);

    this.time.delayedCall(100, () => {
      this.canInteract = true;
    });
  }

  onDifficultyChanged() {
    if (this.upBar) {
      const diffStr = this.dataManager.getCurrentDifficultyName() || "normal";
      this.upBar.updateWeekData(this.dataManager.getCurrentWeek(), diffStr);
    }
  }

  changeWeek(direction) {
    if (!this.canInteract) return;
    if (this.cache.audio.exists("scrollMenu")) this.sound.play("scrollMenu", { volume: 1 });

    this.dataManager.changeWeek(direction);

    if (this.titlesManager) this.titlesManager.updateSelection(this.dataManager.selectedWeekIndex);
    if (this.propsManager) this.propsManager.updateBackground(this.dataManager.getCurrentWeek());
    if (this.tracksManager) this.tracksManager.updateTracks();
    if (this.characterPropsManager) this.characterPropsManager.updateProps();
    
    if (this.upBar) {
      const diffStr = this.dataManager.getCurrentDifficultyName() || "normal";
      this.upBar.updateWeekData(this.dataManager.getCurrentWeek(), diffStr);
    }
  }

  update(time, delta) {
    if (funkin.controls) funkin.controls.update();
    if (this.canInteract && this.inputHandler) this.inputHandler.update();
    if (this.titlesManager) this.titlesManager.update(time, delta);
    if (this.difficultyManager) this.difficultyManager.update();
    if (this.upBar) this.upBar.update(time, delta);
  }

  goBack() {
    if (!this.canInteract) return;
    this.canInteract = false;

    if (this.cache.audio.exists("cancelSound")) this.sound.play("cancelSound");

    if (typeof funkin !== "undefined" && funkin.transition) {
      funkin.transition(this, "MainMenuScene");
    } else if (window.funkin && window.funkin.transition) {
      window.funkin.transition(this, "MainMenuScene");
    } else {
      this.scene.start("MainMenuScene");
    }
  }

  cleanUp() {
    this.events.off("shutdown", this.cleanUp, this);
    this.shutdown();
  }

  shutdown() {
    window.storyModeEventBus.removeAllListeners();

    if (funkin.conductorEvents) funkin.conductorEvents.off("bpm_changed", this.setupBeatTimer, this);
    if (this.beatTimer) {
      this.beatTimer.destroy();
      this.beatTimer = null;
    }

    if (this.inputHandler) {
      if (typeof this.inputHandler.destroy === "function") this.inputHandler.destroy();
      this.inputHandler = null;
    }

    this.input.off("pointerdown");
    this.input.off("pointermove");
    this.input.off("pointerup");

    this.titlesManager = null;
    this.propsManager = null;
    this.tracksManager = null;
    this.difficultyManager = null;

    if (this.characterPropsManager) {
      this.characterPropsManager.destroy();
      this.characterPropsManager = null;
    }
    if (this.upBar) {
      if (this.upBar.bg) this.upBar.bg.destroy();
      if (this.upBar.scoreText) this.upBar.scoreText.destroy();
      if (this.upBar.levelTitleText) this.upBar.levelTitleText.destroy();
      this.upBar = null;
    }

    this.canInteract = false;

    this.children.removeAll(true);
    this.tweens.killAll();
  }
}

window.game.scene.add("StoryModeScene", StoryModeScene);