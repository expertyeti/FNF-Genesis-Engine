/**
 * @file MainMenuEngineVer.js
 * Capa de UI para mostrar la versión del motor.
 */
class MainMenuEngineVer {
  constructor(scene) {
    this.scene = scene;
    this.createUI();
  }

  createUI() {
    const { width, height } = this.scene.cameras.main;

    this.uiCamera = this.scene.cameras.add(0, 0, width, height);
    this.uiCamera.setBackgroundColor("rgba(0,0,0,0)");

    const title = this.scene.game.config.gameTitle || "Genesis Engine";
    const version = this.scene.game.config.gameVersion || "1.0";
    const commit = window.GAME_COMMIT ? ` (${window.GAME_COMMIT})` : "";

    this.versionText = this.scene.add
      .text(5, height - 5, `${title}: ${version}${commit}`, {
        fontFamily: "vcr, Arial, sans-serif",
        fontSize: "23px",
        color: "#ffffff",
        align: "left",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0, 1);

    this.scene.cameras.main.ignore(this.versionText);

    const elementsToIgnore = this.scene.children.list.filter(
      (child) => child !== this.versionText,
    );
    this.uiCamera.ignore(elementsToIgnore);
    this.uiCamera.fadeIn(250, 0, 0, 0);
  }
}

funkin.ui.mainMenu.MainMenuEngineVer = MainMenuEngineVer;
