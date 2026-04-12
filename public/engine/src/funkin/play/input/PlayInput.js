/**
 * @file src/funkin/play/input/PlayInput.js
 */
window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.input = funkin.play.input || {};

class PlayInput {
  constructor(scene) {
    this.scene = scene;
    this.isTransitioning = false;
    this.isDestroyed = false;

    this.pauseDelay = true;
    this.scene.time.delayedCall(300, () => {
      this.pauseDelay = false;
    });

    this.scene.events.on("resume", () => {
      this.pauseDelay = true;
      this.scene.time.delayedCall(300, () => {
        this.pauseDelay = false;
      });
    });

    this.scene.events.once("shutdown", this.destroy, this);

    this.prevPause = false;
    this.prevAccept = false;

    const InputDebuggClass =
      window.funkin.play.input.InputDebugg ||
      (window.funkin.playDebugging && window.funkin.playDebugging.InputDebugg);
    if (InputDebuggClass) {
      this.debugModule = new InputDebuggClass(scene);
    } else {
      console.log("InputDebugg not found");
    }

    if (
      window.funkin.playDebugging &&
      window.funkin.playDebugging.SimpleModeDebug
    ) {
      this.simpleModeDebug = new window.funkin.playDebugging.SimpleModeDebug(
        scene
      );
    }

    if (window.funkin.SongDebugger) {
      this.songDebugger = new window.funkin.SongDebugger(scene);
    }

    if (
      window.funkin.playDebugging &&
      window.funkin.playDebugging.CharacterPositionDebug
    ) {
      this.characterPositionDebug = new window.funkin.playDebugging.CharacterPositionDebug(
        scene
      );
    }
  }

  update() {
    if (this.isDestroyed) return;

    if (!this.arrowsDebug && window.funkin.ArrowModesDebug) {
      this.arrowsDebug = new window.funkin.ArrowModesDebug(this.scene);
    }

    if (this.isTransitioning || this.scene.isGamePaused) return;

    if (this.debugModule && typeof this.debugModule.update === "function") {
      this.debugModule.update();
    }

    if (!window.funkin.controls) return;

    const pauseHit = window.funkin.controls.PAUSE_P;
    const acceptHit = window.funkin.controls.ACCEPT_P;

    if (this.pauseDelay) {
      this.prevPause = pauseHit;
      this.prevAccept = acceptHit;
      return;
    }

    if ((pauseHit && !this.prevPause)) {
      this.triggerPause();
    }

    this.prevPause = pauseHit;
    this.prevAccept = acceptHit;
  }

  triggerPause() {
    this.pauseDelay = true;
    if (!this.scene.isGamePaused) {
      this.scene.isGamePaused = true;
      this.scene.sound.pauseAll();
      this.scene.scene.launch("PauseSubScene");
      this.scene.scene.pause("PlayScene");
    }
  }

  destroy() {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    this.scene.events.off("resume");
    this.scene.events.off("shutdown", this.destroy, this);

    if (this.debugModule) this.debugModule.destroy();
    if (this.arrowsDebug) this.arrowsDebug.destroy();
    if (this.simpleModeDebug) this.simpleModeDebug.destroy();
    if (this.songDebugger) this.songDebugger.destroy();
    if (this.characterPositionDebug) this.characterPositionDebug.destroy();

    this.debugModule = null;
    this.arrowsDebug = null;
    this.simpleModeDebug = null;
    this.songDebugger = null;
    this.characterPositionDebug = null;
  }
}

funkin.play.input.PlayInput = PlayInput;