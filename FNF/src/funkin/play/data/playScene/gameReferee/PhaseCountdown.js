class PhaseCountdown {
  /**
   * @param {Object} referee
   */
  constructor(referee) {
    this.referee = referee;
    this.scene = referee.scene;
  }

  async enter() {
    const scene = this.scene;

    scene.events.once("countdown_finished", () => {
      this.referee.changePhase("playing");
    });

    if (scene.cameras && scene.cameras.cameras) {
      scene.cameras.cameras.forEach((cam) => cam.fadeIn(800, 0, 0, 0));
    }

    scene.time.delayedCall(800, () => {
      if (scene.countDown && scene.countDown.startSong && scene.isReady) {
        scene.countDown.start();
      }
    });
  }

  /**
   * @param {number} time
   * @param {number} delta
   */
  update(time, delta) {
    const scene = this.scene;
    if (!scene.isReady) return;

    if (funkin.controls) funkin.controls.update();
    if (scene.inputHandler) scene.inputHandler.update();
    if (scene.cameraDebug) scene.cameraDebug.update();

    if (scene.gameCam) scene.gameCam.update();
    if (scene.uiCam) scene.uiCam.update();
    if (scene.mainCam) scene.mainCam.update();

    if (scene.strumlines) scene.strumlines.update(time, delta);
    if (funkin.play && funkin.play.health) funkin.play.health.update(time, delta);
    if (scene.healthBar) scene.healthBar.update(time, delta);
    if (scene.scoreText) scene.scoreText.update(time, delta);
  }
}

funkin.play = funkin.play || {};
funkin.play.PhaseCountdown = PhaseCountdown;