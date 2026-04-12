/**
 * @file StoryModeProps.js
 * Construye e interpola el fondo (color o imagen) de cada semana.
 */
class StoryModeProps {
  constructor(scene) {
    this.scene = scene;
    this.currentBg = null;
    this.colorTween = null;
  }

  buildBackground(initialWeekData) {
    const width = this.scene.cameras.main.width;
    const topBlackBar = this.scene.add
      .rectangle(0, 0, width, 56, 0x000000)
      .setOrigin(0, 0)
      .setDepth(99);
    this.currentBg = this.createBgObject(initialWeekData);
    this.currentBg.setAlpha(1.0);
    return this.currentBg;
  }

  createBgObject(weekData) {
    const width = this.scene.cameras.main.width;
    const height = 400;

    let bgVal = "#F9CF51";
    if (
      weekData &&
      weekData.data &&
      weekData.data.weekBackground &&
      weekData.data.weekBackground.trim() !== ""
    ) {
      bgVal = weekData.data.weekBackground.trim();
    }

    let bgObj;
    if (bgVal.startsWith("#")) {
      const colorInt = Phaser.Display.Color.HexStringToColor(bgVal).color;
      bgObj = this.scene.add.rectangle(0, 56, width, height, colorInt);
    } else {
      if (this.scene.textures.exists(bgVal)) {
        bgObj = this.scene.add.sprite(0, 56, bgVal);
      } else {
        const defaultColor =
          Phaser.Display.Color.HexStringToColor("#F9CF51").color;
        bgObj = this.scene.add.rectangle(0, 56, width, height, defaultColor);
        bgVal = "#F9CF51";
      }
    }

    bgObj.setOrigin(0, 0).setDepth(100);
    bgObj.bgValue = bgVal;
    return bgObj;
  }

  updateBackground(weekData) {
    if (!this.currentBg) return;

    let targetVal = "#F9CF51";
    if (
      weekData &&
      weekData.data &&
      weekData.data.weekBackground &&
      weekData.data.weekBackground.trim() !== ""
    ) {
      targetVal = weekData.data.weekBackground.trim();
    }

    if (this.currentBg.bgValue === targetVal) return;
    if (this.colorTween) this.colorTween.stop();

    const isCurrentSimple = this.currentBg.bgValue.startsWith("#");
    const isTargetSimple = targetVal.startsWith("#");

    if (isCurrentSimple && isTargetSimple) {
      const startColorObj = Phaser.Display.Color.IntegerToColor(
        this.currentBg.fillColor,
      );
      const endColorObj = Phaser.Display.Color.HexStringToColor(targetVal);

      this.currentBg.bgValue = targetVal;
      this.colorTween = this.scene.tweens.addCounter({
        from: 0,
        to: 100,
        duration: 900,
        ease: "Quart.easeOut",
        onUpdate: (tween) => {
          const value = tween.getValue();
          const colorInterpolated =
            Phaser.Display.Color.Interpolate.ColorWithColor(
              startColorObj,
              endColorObj,
              100,
              value,
            );
          const colorInt = Phaser.Display.Color.GetColor(
            colorInterpolated.r,
            colorInterpolated.g,
            colorInterpolated.b,
          );
          this.currentBg.setFillStyle(colorInt);
        },
      });
    } else {
      const oldBg = this.currentBg;
      const newBg = this.createBgObject(weekData);
      newBg.setAlpha(0.0);
      this.currentBg = newBg;

      this.scene.tweens.add({
        targets: oldBg,
        alpha: 0.0,
        duration: 600,
        ease: "Linear",
        onComplete: () => oldBg.destroy(),
      });
      this.scene.tweens.add({
        targets: newBg,
        alpha: 1.0,
        duration: 600,
        ease: "Linear",
      });
    }
  }
}

funkin.ui.storyMode.StoryModeProps = StoryModeProps;
