/**
 * Main game scene responsible for mounting and orchestrating real time gameplay.
 */
class PlayScene extends Phaser.Scene {
  constructor() {
    super({ key: "PlayScene" });

    this.playData = null; 
    this.songEndedFlag = false; 
    this.inputHandler = null; 
    this.isReady = false; 
    this.isGamePaused = false; 
    this.referee = null; 
    this.stagePosDebug = null; 
    this.debugCharacterPositions = null; 
  }

  /**
   * @param {Object} data
   */
  init(data) {
    this.events.once("shutdown", this.cleanUp, this);
    this.songEndedFlag = false;
    this.isReady = false;

    if (funkin.MobileBackButton) {
      funkin.MobileBackButton.addIgnoredScene("PlayScene");
    }

    this.debugging = true;
    funkin.playDebugging = funkin.playDebugging || {};
    funkin.playDebugging.enabled = this.debugging;

    if (typeof funkin.debugMode === "undefined") {
      funkin.debugMode = false;
    }

    if (funkin.PlayDataPayload && funkin.PlayDataPayload.actuallyPlaying) {
      this.playData = JSON.parse(JSON.stringify(funkin.PlayDataPayload));
    } else if (data && data.actuallyPlaying) {
      this.playData = data;
    } else if (funkin.PlayDataParser && data && Object.keys(data).length > 0) {
      this.playData = funkin.PlayDataParser.parse(data);
    } else {
      this.playData = {
        sourceScene: "MainMenuScene",
        songPlayList: ["Test"],
        actuallyPlaying: "Test",
        difficulty: "normal",
      };
    }

    if (this.sys && this.sys.settings) {
      this.sys.settings.data = {};
    }

    funkin.PlayDataPayload = this.playData;

    if (this.game && this.game.sound) {
      this.game.sound.pauseOnBlur = false;
    }
  }

  preload() {
    if (funkin.play && funkin.play.PlayPreload) {
      funkin.play.PlayPreload.preloadGeneralAssets(this);
    }
  }

  create() {
    if (this.load.isLoading()) {
      this.load.once("complete", this.initGame, this);
      this.load.start();
    } else {
      this.initGame();
    }
  }

  /**
   * Initializes main components once all resources are correctly created and preloaded
   */
  initGame() {
    if (funkin.play && funkin.play.GameReferee) {
      this.referee = new funkin.play.GameReferee(this);
      this.referee.start();
    } else {
      console.error("GameReferee is not defined game cannot start");
    }

    if ((funkin.debugMode || (funkin.playDebugging && funkin.playDebugging.enabled)) && funkin.playDebugging.CharacterPositionDebug) {
      this.stagePosDebug = new funkin.playDebugging.CharacterPositionDebug(this);
    }

    this.isReady = true;
  }

  /**
   * @param {number} time
   * @param {number} delta
   */
  update(time, delta) {
    if (!this.isReady) return;

    if (this.referee) {
      this.referee.update(time, delta);
    }
  }

  cleanUp() {
    this.events.off("shutdown", this.cleanUp, this);
    this.load.off("complete", this.initGame, this);

    if (funkin.PlayCleanUp) {
      funkin.PlayCleanUp.execute(this);
    }

    if (this.stagePosDebug) {
      this.stagePosDebug.destroy();
      this.stagePosDebug = null;
    }

    this.debugCharacterPositions = null;

    if (funkin.play) {
      funkin.play.currentScene = null;
      funkin.play.health = null;
    }

    this.referee = null;
    this.stageCharacters = null;
    this.isReady = false;
  }
}

window.game.scene.add("PlayScene", PlayScene);