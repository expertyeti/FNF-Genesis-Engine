window.funkin = window.funkin || {};
funkin.play = funkin.play || {};

class PlayScene extends Phaser.Scene {
  constructor() {
    super({ key: "PlayScene" });
    this.playData = null;
    this.isReady = false;
    this.referee = null;
  }

  init(data) {
    // Escuchar el evento de apagado nativo de la escena
    this.events.once("shutdown", this.cleanUp, this);
    this.isReady = false;

    // ... lógica de PlayDataPayload ...
    if (data && data.actuallyPlaying) this.playData = data;
    else this.playData = window.funkin.PlayDataPayload || { actuallyPlaying: "Test" };
  }

  create() {
    this.apiManager = new funkin.play.scripts.api.APIManager(this);
    this.initGame();
  }

  initGame() {
    const RefereeClass = window.funkin.play.data?.referee?.GameReferee || window.funkin.play.GameReferee;
    if (RefereeClass) {
      this.referee = new RefereeClass(this);
      this.referee.start();
    }
    this.isReady = true;
  }

  update(time, delta) {
    if (!this.isReady) return;
    if (this.referee) this.referee.update(time, delta);
  }

  /**
   * CLEANUP: Se activa al salir de la escena o detenerla
   */
  cleanUp() {
    console.log("[PlayScene] Ejecutando Shutdown y Limpieza...");
    
    // Detener el editor si está activo para que restaure el canvas
    if (this.scene.isActive("EditorScene")) {
        this.scene.stop("EditorScene");
    }

    this.isReady = false;

    if (this.referee && typeof this.referee.destroy === "function") {
      this.referee.destroy();
      this.referee = null;
    }

    // Ejecutar la limpieza maestra del motor si existe
    if (window.funkin.play.data?.clean?.PlayCleanUp) {
        window.funkin.play.data.clean.PlayCleanUp.execute(this);
    }

    // Liberar eventos globales
    this.game.events.off('device_input_changed');
    this.events.off("shutdown", this.cleanUp, this);
  }
}

funkin.play.PlayScene = PlayScene;
window.game.scene.add("PlayScene", PlayScene);