/**
 * Freeplay menu scene
 * @extends Phaser.Scene
 */
class FreeplayScene extends Phaser.Scene {
  constructor() {
    super({ key: "FreeplayScene" });
    this.canInteract = false;
    this.currentDisplaySong = null;
    this.currentDisplayDiff = null;
  }

  preload() {
    if (window.FreePlayBG) window.FreePlayBG.preload(this);
    if (!this.cache.audio.exists("cancelMenu")) this.load.audio("cancelMenu", "public/sounds/cancelMenu.ogg");
    if (!this.cache.audio.exists("scrollMenu")) this.load.audio("scrollMenu", "public/sounds/scrollMenu.ogg");
    if (!this.cache.audio.exists("confirmMenu")) this.load.audio("confirmMenu", "public/sounds/confirmMenu.ogg");
    if (window.Alphabet) window.Alphabet.load(this);
    if (!this.cache.audio.exists("freakyMenu")) this.load.audio("freakyMenu", "public/music/FreakyMenu.mp3");
  }

  create() {
    this.events.on("shutdown", this.cleanUp, this);

    if (!this.sound.get("freakyMenu") && this.cache.audio.exists("freakyMenu")) {
      this.sound.add("freakyMenu");
    }

    const music = this.sound.get("freakyMenu");

    if (music && !music.isPlaying) {
      music.play({ loop: true, volume: 1 });
    } else if (music && music.isPlaying && music.volume < 1) {
      this.tweens.add({ targets: music, volume: 1, duration: 1000 });
    }

    if (window.FreePlayBG) this.bgManager = new window.FreePlayBG(this);
    this.cancelSound = this.sound.add("cancelMenu");

    if (window.globalFreeplayData) {
      window.globalFreeplayData = null;
    }

    if (window.FreePlaySongs) this.songsManager = new window.FreePlaySongs(this);
    if (window.FreePlayDiff) this.diffManager = new window.FreePlayDiff(this);
    if (window.FreeplayInput) this.inputHandler = new window.FreeplayInput(this);

    this.time.delayedCall(100, () => {
      this.canInteract = true;
    });
  }

  update(time, delta) {
    if (funkin.controls) funkin.controls.update();
    if (this.inputHandler) this.inputHandler.update();
    if (this.songsManager) this.songsManager.update(time, delta);

    if (this.songsManager && typeof this.songsManager.getCurrentSong === "function") {
      const currentSong = this.songsManager.getCurrentSong();
      const songName = typeof currentSong === "string" ? currentSong : (currentSong && (currentSong.songName || currentSong.name));
      const currentDiff = this.diffManager && this.diffManager.difficulties ? this.diffManager.difficulties[this.diffManager.currentIndex || 0] : "normal";

      if (songName && (this.currentDisplaySong !== songName || this.currentDisplayDiff !== currentDiff)) {
        this.currentDisplaySong = songName;
        this.currentDisplayDiff = currentDiff;
        
        if (this.diffManager && typeof this.diffManager.updateScoreDisplay === "function") {
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
    }

    this.bgManager = null;
    this.canInteract = false;

    this.children.removeAll(true);
    this.tweens.killAll();
  }
}

if (typeof window !== "undefined" && window.game && window.game.scene) {
  window.game.scene.add("FreeplayScene", FreeplayScene);
}