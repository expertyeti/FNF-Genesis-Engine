class FlashEffect extends Phaser.Scene {
  constructor() {
    super({ key: "FlashEffect", active: true });
  }

  create() {
    const screenWidth = this.scale.width;
    const screenHeight = this.scale.height;

    this.whiteScreen = this.add
      .rectangle(
        screenWidth / 2,
        screenHeight / 2,
        screenWidth * 1.5,
        screenHeight * 1.5,
        0xffffff,
      )
      .setOrigin(0.5)
      .setDepth(9999)
      .setAlpha(0);

    this.isTransitioning = false;
  }

  startTransition(nextScene) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    this.scene.bringToTop();

    this.tweens.add({
      targets: this.whiteScreen,
      alpha: 1,
      duration: 200,
      ease: "Linear",
      onComplete: () => {
        const currentScene = this.game.scene
          .getScenes(true)
          .find((s) => s.scene.key !== "FlashEffect");
        if (currentScene) currentScene.scene.stop();

        this.scene.launch(nextScene);
        this.scene.bringToTop();

        const nextSceneObj = this.scene.get(nextScene);
        nextSceneObj.events.once("create", () => {
          this.tweens.add({
            targets: this.whiteScreen,
            alpha: 0,
            duration: 500,
            ease: "Linear",
            onComplete: () => {
              this.isTransitioning = false;
            },
          });
        });
      },
    });
  }
}

funkin.utils.FlashEffect = FlashEffect;
window.game.scene.add("FlashEffect", FlashEffect);
