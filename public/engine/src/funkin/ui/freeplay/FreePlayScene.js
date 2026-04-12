/**
 * @file FreePlayScene.js
 * Escena principal del menú de selección libre. Orquesta todo el flujo de Freeplay.
 */
class FreePlayScene extends Phaser.Scene {
  constructor() {
    super({ key: "FreePlayScene" });
    this.canInteract = false;
    this.currentDisplaySong = null;
    this.currentDisplayDiff = null;
  }

  preload() {
    if (funkin.ui.freeplay.FreePlayBG)
      funkin.ui.freeplay.FreePlayBG.preload(this);

    if (!this.cache.audio.exists("cancelMenu"))
      this.load.audio(
        "cancelMenu",
        window.BASE_URL + "assets/sounds/cancelMenu.ogg",
      );
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
    if (!this.cache.audio.exists("freakyMenu"))
      this.load.audio(
        "freakyMenu",
        window.BASE_URL + "assets/music/FreakyMenu.mp3",
      );

    if (window.Alphabet) window.Alphabet.load(this);
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
    if (music && !music.isPlaying) {
      music.play({ loop: true, volume: 1 });
    } else if (music && music.isPlaying && music.volume < 1) {
      this.tweens.add({ targets: music, volume: 1, duration: 1000 });
    }

    if (funkin.ui.freeplay.FreePlayBG)
      this.bgManager = new funkin.ui.freeplay.FreePlayBG(this);
    this.cancelSound = this.sound.add("cancelMenu");

    if (funkin.ui.freeplay.FreePlaySongs)
      this.songsManager = new funkin.ui.freeplay.FreePlaySongs(this);
    if (funkin.ui.freeplay.FreePlayDiff)
      this.diffManager = new funkin.ui.freeplay.FreePlayDiff(this);
    if (funkin.ui.freeplay.FreePlayInput)
      this.inputHandler = new funkin.ui.freeplay.FreePlayInput(this);

    this.time.delayedCall(100, () => {
      this.canInteract = true;
    });
  }

  update(time, delta) {
    if (funkin.controls) funkin.controls.update();
    if (this.inputHandler) this.inputHandler.update();
    if (this.songsManager) this.songsManager.update(time, delta);

    if (
      this.songsManager &&
      typeof this.songsManager.getCurrentSong === "function"
    ) {
      const currentSong = this.songsManager.getCurrentSong();
      const songName =
        typeof currentSong === "string"
          ? currentSong
          : currentSong && (currentSong.songName || currentSong.name);
      const currentDiff =
        this.diffManager && this.diffManager.difficulties
          ? this.diffManager.difficulties[this.diffManager.currentIndex || 0]
          : "normal";

      if (
        songName &&
        (this.currentDisplaySong !== songName ||
          this.currentDisplayDiff !== currentDiff)
      ) {
        this.currentDisplaySong = songName;
        this.currentDisplayDiff = currentDiff;

        if (
          this.diffManager &&
          typeof this.diffManager.updateScoreDisplay === "function"
        ) {
          this.diffManager.updateScoreDisplay(songName);
        }
      }
    }
  }

  cleanUp() {
    this.events.off("shutdown", this.cleanUp, this);
    this.shutdown();
  }

  shutdown() {
    if (this.inputHandler && typeof this.inputHandler.destroy === "function") {
      this.inputHandler.destroy();
      this.inputHandler = null;
    }
    if (this.songsManager && typeof this.songsManager.destroy === "function") {
      this.songsManager.destroy();
      this.songsManager = null;
    }
    if (this.diffManager && typeof this.diffManager.destroy === "function") {
      this.diffManager.destroy();
      this.diffManager = null;
    }
    if (this.bgManager && typeof this.bgManager.destroy === "function") {
      this.bgManager.destroy();
      this.bgManager = null;
    }

    this.canInteract = false;
    this.children.removeAll(true);
    this.tweens.killAll();
  }
}

window.game.scene.add("FreePlayScene", FreePlayScene);