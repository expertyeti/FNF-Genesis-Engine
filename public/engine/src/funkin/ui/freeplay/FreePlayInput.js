// src/funkin/ui/freeplay/FreePlayInput.js

window.funkin = window.funkin || {};
window.funkin.ui = window.funkin.ui || {};
window.funkin.ui.freeplay = window.funkin.ui.freeplay || {};

class FreePlayInput {
  constructor(scene) {
    this.scene = scene;
    this.isTransitioning = false;
    this.wheelTimer = 0;
    this.touchStartY = 0;
    this.touchStartX = 0;
    this.isSwiping = false;

    this.onWheel = (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
      if (
        this.isTransitioning ||
        (this.scene.songsManager && this.scene.songsManager.isConfirming)
      )
        return;
      if (this.scene.time.now < this.wheelTimer) return;
      this.wheelTimer = this.scene.time.now + 100;

      if (this.scene.songsManager) {
        if (deltaY > 0) this.scene.songsManager.updateSelection(1);
        else if (deltaY < 0) this.scene.songsManager.updateSelection(-1);
      }
    };

    this.scene.input.on("wheel", this.onWheel);
    if (!this.scene.sys.game.device.os.desktop) this.setupMobileControls();
  }

  setupMobileControls() {
    this.onPointerDown = (pointer) => {
      this.touchStartY = pointer.y;
      this.touchStartX = pointer.x;
      this.isSwiping = false;
    };

    this.onPointerMove = (pointer) => {
      if (
        !pointer.isDown ||
        this.isTransitioning ||
        (this.scene.songsManager && this.scene.songsManager.isConfirming)
      )
        return;

      const diffY = pointer.y - this.touchStartY;
      const diffX = pointer.x - this.touchStartX;

      if (Math.abs(diffY) > 60) {
        this.isSwiping = true;
        if (this.scene.songsManager)
          this.scene.songsManager.updateSelection(diffY < 0 ? 1 : -1);
        this.touchStartY = pointer.y;
      }

      if (Math.abs(diffX) > 60) {
        this.isSwiping = true;
        if (this.scene.diffManager)
          this.scene.diffManager.changeDifficulty(diffX < 0 ? 1 : -1);
        this.touchStartX = pointer.x;
      }
    };

    this.onPointerUp = (pointer, gameObjects) => {
      if (
        this.isSwiping ||
        this.isTransitioning ||
        (this.scene.songsManager && this.scene.songsManager.isConfirming)
      ) {
        this.isSwiping = false;
        return;
      }

      if (gameObjects.length > 0 && this.scene.songsManager) {
        const clickedObj = gameObjects[0];
        
        const index = this.scene.songsManager.songTexts.indexOf(clickedObj);

        if (index !== -1) {
          if (index === this.scene.songsManager.selectedIndex) {
            this.confirmSelection();
          } else {
            if (typeof this.scene.songsManager.selectExactSong === "function") {
                this.scene.songsManager.selectExactSong(index);
            }
          }
        }
      }
    };

    this.scene.input.on("pointerdown", this.onPointerDown);
    this.scene.input.on("pointermove", this.onPointerMove);
    this.scene.input.on("pointerup", this.onPointerUp);
  }

  update() {
    if (
      this.isTransitioning ||
      (this.scene.songsManager && this.scene.songsManager.isConfirming)
    )
      return;
    if (!this.scene.canInteract || !funkin.controls) return;

    if (funkin.controls.BACK_P) {
      this.goBack();
      return;
    }

    if (this.scene.songsManager) {
      if (funkin.controls.UI_UP_P) this.scene.songsManager.updateSelection(-1);
      if (funkin.controls.UI_DOWN_P) this.scene.songsManager.updateSelection(1);
      if (funkin.controls.ACCEPT_P) this.confirmSelection();
    }

    if (this.scene.diffManager) {
      if (funkin.controls.UI_LEFT_P)
        this.scene.diffManager.changeDifficulty(-1);
      if (funkin.controls.UI_RIGHT_P)
        this.scene.diffManager.changeDifficulty(1);
    }
  }

  confirmSelection() {
    if (this.isTransitioning || !this.scene.canInteract) return;

    if (!this.scene.scene.manager.keys.hasOwnProperty("PlayScene")) {
      if (this.scene.cancelSound) this.scene.cancelSound.play();
      this.scene.cameras.main.shake(100, 0.01);
      return;
    }

    this.scene.canInteract = false;
    this.isTransitioning = true;

    if (this.scene.cache.audio.exists("confirmMenu"))
      this.scene.sound.play("confirmMenu");
    try {
      if (navigator.vibrate) navigator.vibrate([150, 50, 150]);
    } catch (e) {}

    if (this.scene.songsManager) this.scene.songsManager.confirmSelection();

    let selectedSong = "Test";
    let diffString = "normal";

    // fix: obtenemos la cancion directo del gestor maestro
    if (this.scene.songsManager) {
        const currentSong = this.scene.songsManager.getCurrentSong();
        if (currentSong) {
            selectedSong = currentSong.name || currentSong.songName || currentSong[0] || "Test";
        }
    }

    if (
      this.scene.diffManager &&
      this.scene.diffManager.difficulties &&
      this.scene.diffManager.currentIndex !== undefined
    ) {
      diffString =
        this.scene.diffManager.difficulties[
          this.scene.diffManager.currentIndex
        ].toLowerCase();
    }

    const playData = {
      sourceScene: "FreePlayScene",
      songPlayList: [selectedSong],
      actuallyPlaying: selectedSong,
      difficulty: diffString,
    };

    funkin.PlayDataPayload = JSON.parse(JSON.stringify(playData));

    this.scene.time.delayedCall(1500, () => {
      const music = this.scene.sound.get("freakyMenu");
      if (music && music.isPlaying) music.stop();

      if (funkin.transition) funkin.transition(this.scene, "PlayScene");
      else this.scene.scene.start("PlayScene");
    });
  }

  goBack() {
    this.isTransitioning = true;
    if (this.scene.cancelSound) this.scene.cancelSound.play();

    if (funkin.transition) funkin.transition(this.scene, "MainMenuScene");
    else this.scene.scene.start("MainMenuScene");
  }

  destroy() {
    this.scene.input.off("wheel", this.onWheel);
    if (!this.scene.sys.game.device.os.desktop) {
      this.scene.input.off("pointerdown", this.onPointerDown);
      this.scene.input.off("pointermove", this.onPointerMove);
      this.scene.input.off("pointerup", this.onPointerUp);
    }
  }
}

funkin.ui.freeplay.FreePlayInput = FreePlayInput;