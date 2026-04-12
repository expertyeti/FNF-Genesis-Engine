/**
 * @file StoryModeScene.js
 * Escena orquestadora del menú de modo historia.
 */
class StoryModeScene extends Phaser.Scene {
  constructor() {
    super({ key: "StoryModeScene" });
    this.canInteract = false;
    this.beatTimer = null;
  }

  preload() {
    this.load.imageBitmapFormat = true;
    if (!this.cache.audio.exists("scrollMenu"))
      this.load.audio(
        "scrollMenu",
        window.BASE_URL + "assets/sounds/scrollMenu.ogg",
      );
    if (!this.cache.audio.exists("confirmMenu"))
      this.load.audio(
        "confirmMenu",
        window.BASE_URL + "assets/sounds/confirmMenu.ogg",
      );
    if (!this.textures.exists("tracks_image"))
      this.load.image(
        "tracks_image",
        window.BASE_URL + "assets/images/menu/storymode/Tracks.png",
      );
    if (!this.textures.exists("storymode_arrows")) {
      this.load.atlasXML(
        "storymode_arrows",
        window.BASE_URL + "assets/images/menu/storymode/arrows.png",
        window.BASE_URL + "assets/images/menu/storymode/arrows.xml",
      );
    }

    const difficulties = ["easy", "normal", "hard"];
    difficulties.forEach((diff) => {
      if (!this.textures.exists(`difficulty_${diff}`)) {
        this.load.image(
          `difficulty_${diff}`,
          window.BASE_URL +
            `assets/images/menu/storymode/difficults/${diff}.png`,
        );
      }
    });
  }

  create() {
    this.events.on("shutdown", this.cleanUp, this);

    if (
      !this.sound.get("freakyMenu") &&
      this.cache.audio.exists("freakyMenu")
    ) {
      this.sound.add("freakyMenu");
    }
    const music = this.sound.get("freakyMenu");

    if (music && !music.isPlaying) music.play({ loop: true, volume: 1 });
    else if (music && music.isPlaying && music.volume < 1) {
      this.tweens.add({ targets: music, volume: 1, duration: 1000 });
    }

    if (funkin.conductor) funkin.conductor.bpm.set(102);

    this.setupBeatTimer();
    if (funkin.conductorEvents)
      funkin.conductorEvents.on("bpm_changed", this.setupBeatTimer, this);

    // Instanciamos la clase de datos global modular
    this.dataManager = new funkin.ui.storyMode.StoryModeData();

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
    if (funkin.ui.storyMode.StoryModeProps) {
      this.propsManager = new funkin.ui.storyMode.StoryModeProps(this);
      this.propsManager.buildBackground(this.dataManager.getCurrentWeek());
    }

    if (funkin.ui.storyMode.StoryModeTitles)
      this.titlesManager = new funkin.ui.storyMode.StoryModeTitles(
        this,
        this.dataManager,
      );
    if (funkin.ui.storyMode.StoryModeTracks)
      this.tracksManager = new funkin.ui.storyMode.StoryModeTracks(
        this,
        this.dataManager,
      );
    if (funkin.ui.storyMode.StoryModeDifficulty)
      this.difficultyManager = new funkin.ui.storyMode.StoryModeDifficulty(
        this,
        this.dataManager,
      );
    if (funkin.ui.storyMode.StoryModeCharacterProps)
      this.characterPropsManager =
        new funkin.ui.storyMode.StoryModeCharacterProps(this, this.dataManager);

    if (funkin.ui.storyMode.StoryModeUpBar) {
      this.upBar = new funkin.ui.storyMode.StoryModeUpBar(this);
      const diffStr = this.dataManager.getCurrentDifficultyName() || "normal";
      this.upBar.updateWeekData(this.dataManager.getCurrentWeek(), diffStr);
    }

    this.inputHandler = new funkin.ui.storyMode.StoryModeInput(this);

    this.time.delayedCall(100, () => {
      this.canInteract = true;
    });
  }

  // --- MÉTODOS LLAMADOS POR EL INPUT (Reemplazan al EventBus) ---

  changeWeek(direction) {
    if (!this.canInteract) return;
    if (this.cache.audio.exists("scrollMenu"))
      this.sound.play("scrollMenu", { volume: 1 });

    this.dataManager.changeWeek(direction);

    if (this.titlesManager)
      this.titlesManager.updateSelection(this.dataManager.selectedWeekIndex);
    if (this.propsManager)
      this.propsManager.updateBackground(this.dataManager.getCurrentWeek());
    if (this.tracksManager) this.tracksManager.updateTracks();
    if (this.characterPropsManager) this.characterPropsManager.updateProps();

    if (this.upBar) {
      this.upBar.updateWeekData(
        this.dataManager.getCurrentWeek(),
        this.dataManager.getCurrentDifficultyName(),
      );
    }
  }

  changeDifficulty(direction) {
    if (!this.canInteract) return;
    if (this.cache.audio.exists("scrollMenu"))
      this.sound.play("scrollMenu", { volume: 1 });

    if (this.difficultyManager)
      this.difficultyManager.changeDifficulty(direction);

    if (this.upBar) {
      this.upBar.updateWeekData(
        this.dataManager.getCurrentWeek(),
        this.dataManager.getCurrentDifficultyName(),
      );
    }
  }

  confirmSelection() {
    if (!this.canInteract) return;

    if (!this.scene.manager.keys.hasOwnProperty("PlayScene")) {
      console.warn(`[Genesis Engine] PlayScene no registrada.`);
      if (this.cache.audio.exists("cancelSound"))
        this.sound.play("cancelSound");
      this.cameras.main.shake(100, 0.01);
      return;
    }

    this.canInteract = false;

    if (this.cache.audio.exists("confirmMenu")) this.sound.play("confirmMenu");
    try {
      if (navigator.vibrate) navigator.vibrate([150, 50, 150]);
    } catch (e) {}

    if (this.titlesManager)
      this.titlesManager.startFlashing(this.dataManager.selectedWeekIndex);
    if (this.characterPropsManager) this.characterPropsManager.playConfirm();

    const currentWeek = this.dataManager.getCurrentWeek();
    let playlist = [];

    const songsArray =
      currentWeek && currentWeek.data
        ? currentWeek.data.tracks || currentWeek.data.songs
        : null;
    if (songsArray && Array.isArray(songsArray)) {
      playlist = songsArray.map((songData) => {
        if (Array.isArray(songData)) return songData[0];
        if (typeof songData === "string") return songData;
        if (songData && songData.name) return songData.name;
        return "Test";
      });
    }

    if (playlist.length === 0) playlist = ["Test"];
    const diffString = this.dataManager.getCurrentDifficultyName() || "normal";

    const playData = {
      sourceScene: "StoryModeScene",
      songPlayList: playlist,
      actuallyPlaying: playlist[0],
      difficulty: diffString,
    };

    funkin.PlayDataPayload = JSON.parse(JSON.stringify(playData));

    this.time.delayedCall(1500, () => {
      const music = this.sound.get("freakyMenu");
      if (music && music.isPlaying) music.stop();

      if (funkin.transition) {
        funkin.transition(this, "PlayScene");
      } else {
        this.scene.start("PlayScene", playData);
      }
    });
  }

  goBack() {
    if (!this.canInteract) return;
    this.canInteract = false;

    if (this.cache.audio.exists("cancelSound")) this.sound.play("cancelSound");

    if (funkin.transition) {
      funkin.transition(this, "MainMenuScene");
    } else {
      this.scene.start("MainMenuScene");
    }
  }

  // -------------------------------------------------------------

  update(time, delta) {
    if (funkin.controls) funkin.controls.update();
    if (this.canInteract && this.inputHandler) this.inputHandler.update();
    if (this.titlesManager) this.titlesManager.update(time, delta);
    if (this.difficultyManager) this.difficultyManager.update();
    if (this.upBar) this.upBar.update(time, delta);
  }

  cleanUp() {
    this.events.off("shutdown", this.cleanUp, this);
    this.shutdown();
  }

  shutdown() {
    if (funkin.conductorEvents)
      funkin.conductorEvents.off("bpm_changed", this.setupBeatTimer, this);
    if (this.beatTimer) {
      this.beatTimer.destroy();
      this.beatTimer = null;
    }

    if (this.inputHandler) {
      if (typeof this.inputHandler.destroy === "function")
        this.inputHandler.destroy();
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
