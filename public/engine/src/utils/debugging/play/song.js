window.funkin = window.funkin || {};

class SongDebugger {
  constructor(scene) {
    this.scene = scene;
    this.speedStep = 0.1;
    this.timeStep = 10;
    this.isDestroyed = false;

    this.scene.events.once("shutdown", this.destroy, this);
    this.setupKeys();
  }

  setupKeys() {
    this.keyHandler = (e) => {
      if (e.shiftKey && (e.code === "KeyR")) {
        this.restartSong();
        return;
      }

      if (!window.funkin.debugMode || !e.altKey) return;

      if (["Digit1", "Digit2", "Digit3", "Digit4", "Digit7", "Digit8"].includes(e.code)) {
        e.stopPropagation();
        e.preventDefault();

        switch (e.code) {
          case "Digit1": this.changeSpeed(-this.speedStep); break; 
          case "Digit2": this.changeSpeed(this.speedStep); break;  
          case "Digit3": this.changeTime(-this.timeStep); break;   
          case "Digit4": this.changeTime(this.timeStep); break;    
          case "Digit7": this.changePlaylistSong(-1); break;       
          case "Digit8": this.changePlaylistSong(1); break;        
        }
      }
    };

    window.addEventListener("keydown", this.keyHandler, true);
  }

  restartSong() {
    if (this.scene && this.scene.scene) {
      console.log("Restarting song...");
      this.scene.sound.stopAll();

      if (window.funkin.PlayDataPayload) {
        this.scene.scene.restart(window.funkin.PlayDataPayload);
      } else {
        this.scene.scene.restart();
      }
    }
  }

  changeSpeed(amount) {
    let newRate = 1.0;
    let rateChanged = false;

    const allSounds = this.scene.sound.sounds || [];

    allSounds.forEach((sound) => {
      let currentRate = typeof sound.rate === "number" ? sound.rate : sound.totalRate || 1.0;
      newRate = currentRate + amount;
      newRate = Phaser.Math.Clamp(newRate, 0.1, 3.0);

      if (typeof sound.setRate === "function") sound.setRate(newRate);
      else sound.rate = newRate;
      rateChanged = true;
    });

    if (window.funkin.play && window.funkin.play.audio) {
      Object.values(window.funkin.play.audio).forEach((track) => {
        if (track && typeof track.setRate === "function") {
          track.setRate(newRate);
          rateChanged = true;
        }
      });
    }

    if (rateChanged && this.scene) {
      if (this.scene.anims) this.scene.anims.globalTimeScale = newRate;
      if (this.scene.tweens) this.scene.tweens.timeScale = newRate;
      if (this.scene.time) this.scene.time.timeScale = newRate;
      console.log("Global speed: " + newRate.toFixed(2) + "x");
    }
  }

  changeTime(amount) {
    let newTimeSet = -1;

    const allSounds = this.scene.sound.sounds || [];
    allSounds.forEach((sound) => {
      if (!sound.isPlaying) return;
      let currentSeek = sound.seek || 0;
      let newTime = currentSeek + amount;
      newTime = Phaser.Math.Clamp(newTime, 0, sound.duration || 0);

      if (typeof sound.setSeek === "function") sound.setSeek(newTime);
      else sound.seek = newTime;
      newTimeSet = newTime;
    });

    if (window.funkin.play && window.funkin.play.audio) {
      Object.values(window.funkin.play.audio).forEach((track) => {
        if (track && track.isPlaying) {
          let currentSeek = track.seek || 0;
          let newTime = currentSeek + amount;
          newTime = Phaser.Math.Clamp(newTime, 0, track.duration || 0);
          if (typeof track.setSeek === "function") track.setSeek(newTime);
          newTimeSet = newTime;
        }
      });
    }

    if (newTimeSet !== -1 && window.funkin.conductor) {
      window.funkin.conductor.songPosition = newTimeSet * 1000;
      console.log("Song time set to: " + newTimeSet.toFixed(2) + "s");
    }
  }

  changePlaylistSong(direction) {
    if (!this.scene.playData || !this.scene.playData.songPlayList) return;

    const currentList = this.scene.playData.songPlayList;
    const currentIndex = currentList.indexOf(this.scene.playData.actuallyPlaying);

    if (currentIndex !== -1) {
      let newIndex = currentIndex + direction;

      if (newIndex >= 0 && newIndex < currentList.length) {
        const nextSong = currentList[newIndex];

        this.scene.playData.actuallyPlaying = nextSong;
        window.funkin.PlayDataPayload = JSON.parse(JSON.stringify(this.scene.playData));

        if (window.funkin.songPlaylist) {
          window.funkin.songPlaylist.stop();
        }

        console.log("Changing song to: " + nextSong);
        this.scene.scene.restart();
      } else {
        console.log("No more songs in playlist in that direction.");
      }
    }
  }

  destroy() {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    window.removeEventListener("keydown", this.keyHandler, true);

    if (this.scene) {
      if (this.scene.anims) this.scene.anims.globalTimeScale = 1.0;
      if (this.scene.tweens) this.scene.tweens.timeScale = 1.0;
      if (this.scene.time) this.scene.time.timeScale = 1.0;

      if (this.scene.sound && this.scene.sound.sounds) {
        this.scene.sound.sounds.forEach((sound) => {
          if (typeof sound.setRate === "function") sound.setRate(1.0);
          else sound.rate = 1.0;
        });
      }

      if (this.scene.events) {
        this.scene.events.off("shutdown", this.destroy, this);
      }
    }

    this.scene = null;
  }
}

funkin.SongDebugger = SongDebugger;