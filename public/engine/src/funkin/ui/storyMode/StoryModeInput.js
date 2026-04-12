/**
 * @file StoryModeInput.js
 * Manejador de la entrada de controles y gestos táctiles.
 * Se comunica directamente con los métodos de la escena.
 */
class StoryModeInput {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
    this.wheelTimer = 0;
    this.touchStartY = 0;
    this.touchStartX = 0;
    this.isSwiping = false;
    this.activeArrow = null;

    this.onWheel = (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
      if (!this.scene.canInteract) return;
      if (this.scene.time.now < this.wheelTimer) return;
      this.wheelTimer = this.scene.time.now + 100;

      if (deltaY > 0) this.scene.changeWeek(1);
      else if (deltaY < 0) this.scene.changeWeek(-1);
    };

    this.scene.input.on("wheel", this.onWheel);
    if (!this.scene.sys.game.device.os.desktop) this.setupMobileControls();
  }

  setupMobileControls() {
    if (this.scene.titlesManager && this.scene.titlesManager.titleSprites) {
      this.scene.titlesManager.titleSprites.forEach((sprite) =>
        sprite.setInteractive(),
      );
    }

    this.onPointerDown = (pointer, gameObjects) => {
      this.touchStartY = pointer.y;
      this.touchStartX = pointer.x;
      this.isSwiping = false;

      if (gameObjects.length > 0) {
        const obj = gameObjects[0];
        if (obj.name === "leftArrowDiff") {
          if (funkin.controls) funkin.controls.simulatePress("UI_LEFT");
          this.activeArrow = "UI_LEFT";
        } else if (obj.name === "rightArrowDiff") {
          if (funkin.controls) funkin.controls.simulatePress("UI_RIGHT");
          this.activeArrow = "UI_RIGHT";
        }
      }
    };

    this.onPointerMove = (pointer) => {
      if (!pointer.isDown || !this.scene.canInteract) return;

      const diffY = pointer.y - this.touchStartY;
      const diffX = pointer.x - this.touchStartX;

      if (Math.abs(diffY) > 70) {
        this.isSwiping = true;
        this.scene.changeWeek(diffY < 0 ? 1 : -1);
        this.touchStartY = pointer.y;
      }

      if (Math.abs(diffX) > 70 && !this.activeArrow) {
        this.isSwiping = true;
        this.scene.changeDifficulty(diffX < 0 ? 1 : -1);
        this.touchStartX = pointer.x;
      }
    };

    this.onPointerUp = (pointer, gameObjects) => {
      if (this.activeArrow) {
        if (funkin.controls) funkin.controls.simulateRelease(this.activeArrow);
        this.activeArrow = null;
      }

      if (!this.isSwiping && this.scene.canInteract) {
        if (gameObjects.length > 0) {
          const obj = gameObjects[0];
          if (
            this.scene.titlesManager &&
            this.scene.titlesManager.titleSprites.includes(obj)
          ) {
            const index = this.scene.titlesManager.titleSprites.indexOf(obj);
            if (index === this.scene.dataManager.selectedWeekIndex) {
              this.scene.confirmSelection();
            } else {
              this.scene.dataManager.selectedWeekIndex = index;
              this.scene.changeWeek(0);
            }
          }
        }
      }
      this.isSwiping = false;
    };

    this.scene.input.on("pointerdown", this.onPointerDown);
    this.scene.input.on("pointermove", this.onPointerMove);
    this.scene.input.on("pointerup", this.onPointerUp);
  }

  update() {
    if (!this.scene.canInteract || !funkin.controls) return;

    if (funkin.controls.BACK_P) this.scene.goBack();
    if (funkin.controls.ACCEPT_P) this.scene.confirmSelection();
    if (funkin.controls.UI_UP_P) this.scene.changeWeek(-1);
    if (funkin.controls.UI_DOWN_P) this.scene.changeWeek(1);
    if (funkin.controls.UI_LEFT_P) this.scene.changeDifficulty(-1);
    if (funkin.controls.UI_RIGHT_P) this.scene.changeDifficulty(1);
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

funkin.ui.storyMode.StoryModeInput = StoryModeInput;
