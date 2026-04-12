/**
 * @file StoryModeTitles.js
 * Muestra los sprites con los títulos de las semanas y controla su animación y posicionamiento.
 */
class StoryModeTitles {
  constructor(scene, dataManager) {
    this.scene = scene;
    this.dataManager = dataManager;
    this.titleSprites = [];
    this.isFlashing = false;
    this.flashIndex = -1;
    this.flashTick = 0;
    this.flashFramerate = 24;
    this.padding = 30;

    this.createTitles();
  }

  createTitles() {
    const screenCenterX = this.scene.cameras.main.width / 2;
    const startY = 520;

    this.dataManager.weeks.forEach((week) => {
      const sprite = this.scene.add.sprite(
        screenCenterX,
        startY,
        week.titleImage,
      );
      sprite.setOrigin(0.5, 0.5).setDepth(1);
      sprite.targetY = startY;
      sprite.alpha = 0.6;
      sprite.isCyan = false;
      this.titleSprites.push(sprite);
    });

    this.updateSelection(this.dataManager.selectedWeekIndex);
    this.titleSprites.forEach((sprite) => (sprite.y = sprite.targetY));
  }

  updateSelection(currentIndex) {
    if (this.titleSprites.length === 0 || this.isFlashing) return;

    const startY = 520;

    this.titleSprites.forEach((item, index) => {
      if (index === currentIndex) {
        item.alpha = 1.0;
        item.targetY = startY;
      } else {
        item.alpha = 0.6;
      }
    });

    for (let i = currentIndex + 1; i < this.titleSprites.length; i++) {
      const prevItem = this.titleSprites[i - 1];
      const currentItem = this.titleSprites[i];
      const offset =
        prevItem.displayHeight / 2 +
        currentItem.displayHeight / 2 +
        this.padding;
      currentItem.targetY = prevItem.targetY + offset;
    }

    for (let i = currentIndex - 1; i >= 0; i--) {
      const nextItem = this.titleSprites[i + 1];
      const currentItem = this.titleSprites[i];
      const offset =
        nextItem.displayHeight / 2 +
        currentItem.displayHeight / 2 +
        this.padding;
      currentItem.targetY = nextItem.targetY - offset;
    }
  }

  startFlashing(index) {
    this.isFlashing = true;
    this.flashIndex = index;
    this.flashTick = 0;
  }

  update(time, delta) {
    if (this.titleSprites.length === 0) return;

    const lerpFactor = Phaser.Math.Clamp(delta * 0.015, 0, 1);
    this.titleSprites.forEach((sprite) => {
      sprite.y = Phaser.Math.Linear(sprite.y, sprite.targetY, lerpFactor);
    });

    if (this.isFlashing && this.titleSprites[this.flashIndex]) {
      this.flashTick += delta / 1000;
      if (this.flashTick >= 1 / this.flashFramerate) {
        this.flashTick %= 1 / this.flashFramerate;
        const sprite = this.titleSprites[this.flashIndex];
        sprite.isCyan = !sprite.isCyan;
        sprite.setTint(sprite.isCyan ? 0x33ffff : 0xffffff);
      }
    }
  }
}

funkin.ui.storyMode.StoryModeTitles = StoryModeTitles;
