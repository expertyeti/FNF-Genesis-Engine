/**
 * @file src/funkin/play/PlayScene.js
 */
window.funkin = window.funkin || {};
funkin.play = funkin.play || {};

class PlayScene extends Phaser.Scene {
  constructor() {
    super({ key: "PlayScene" });

    this.playData = null;
    this.songEndedFlag = false;
    this.inputHandler = null;
    this.isReady = false;
    this.isGamePaused = false;
    this.referee = null;
    this.resumeWithCountdown = false;

    this.isRewinding = false;
  }

  init(data) {
    this.events.once("shutdown", this.cleanUp, this);
    this.songEndedFlag = false;
    this.isReady = false;
    this.isRewinding = false;

    if (window.funkin.utils && window.funkin.utils.MobileBackButton) {
      window.funkin.utils.MobileBackButton.addIgnoredScene("PlayScene");
    }

    if (window.funkin.PlayDataPayload && window.funkin.PlayDataPayload.actuallyPlaying) {
      this.playData = JSON.parse(JSON.stringify(window.funkin.PlayDataPayload));
    } else if (data && data.actuallyPlaying) {
      this.playData = data;
    } else {
      this.playData = {
        sourceScene: "MainMenuScene",
        actuallyPlaying: "Test",
        difficulty: "normal",
      };
    }

    window.funkin.PlayDataPayload = this.playData;
  }

  create() {
    if (this.load.isLoading()) {
      this.load.once("complete", this.initGame, this);
      this.load.start();
    } else {
      this.initGame();
    }
  }

  initGame() {
    const refereeNamespace = window.funkin.play.data && window.funkin.play.data.referee;
    const RefereeClass = refereeNamespace ? refereeNamespace.GameReferee : window.funkin.play.GameReferee;

    if (RefereeClass) {
      this.referee = new RefereeClass(this);
      this.referee.start();
    }
    
    this._onDeviceInputChanged = (isMobile) => {
        if (this.strumlines && window.funkin.play.visuals.arrows.strumlines.StrumlineLayout) {
            window.funkin.play.visuals.arrows.strumlines.StrumlineLayout.updateLayout(this.strumlines);
        }
    };
    this.game.events.on('device_input_changed', this._onDeviceInputChanged, this);

    this.isReady = true;
  }

  update(time, delta) {
    if (!this.isReady) return;

    if (this.isRewinding) {
      if (this.strumlines) this.strumlines.update(time, delta);
      if (this.notesManager) this.notesManager.update(time, delta);
      if (this.sustainNotesManager) this.sustainNotesManager.update(time, delta);
      if (this.scoreText) this.scoreText.update(time, delta);
      if (this.healthBar) this.healthBar.update(time, delta);
      return;
    }

    if (this.referee) this.referee.update(time, delta);
  }

  cleanUp() {
    this.events.off("shutdown", this.cleanUp, this);
    
    if (this.game && this.game.events) {
        this.game.events.emit('destroy_mobile_pause');
        
        if (this._onDeviceInputChanged) {
            this.game.events.off('device_input_changed', this._onDeviceInputChanged, this);
            this._onDeviceInputChanged = null;
        }
    }

    this.isReady = false;

    if (this.inputHandler && typeof this.inputHandler.destroy === "function") {
      this.inputHandler.destroy();
      this.inputHandler = null;
    }

    if (this.referee && typeof this.referee.destroy === "function") {
      this.referee.destroy();
      this.referee = null;
    }

    // ELIMINADOR MAESTRO DE DUPLICACIÓN: Se asegura de que TODO muera al salir de la escena
    if (funkin.play && funkin.play.data && funkin.play.data.clean && funkin.play.data.clean.PlayCleanUp) {
        funkin.play.data.clean.PlayCleanUp.execute(this);
    }
  }
}

funkin.play.PlayScene = PlayScene;
window.game.scene.add("PlayScene", PlayScene);