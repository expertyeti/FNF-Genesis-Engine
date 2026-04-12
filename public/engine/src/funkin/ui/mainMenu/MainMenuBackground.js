/**
 * @file MainMenuBackground.js
 * Fondo parallax con soporte para giroscopio en móviles.
 */
class MainMenuBackground {
  constructor(scene, spriteData) {
    this.scene = scene;
    const { width, height } = scene.scale;
    const bgData = spriteData.bg;
    const flashData = spriteData.flash;

    this.gyroPaddingX = 60;
    this.gyroPaddingY = 60;
    this.targetGyroOffsetX = 0;
    this.targetGyroOffsetY = 0;
    this.currentGyroOffsetX = 0;
    this.currentGyroOffsetY = 0;

    let minItemY = height / 2;
    let maxItemY = height / 2;

    if (spriteData.items && spriteData.items.length > 0) {
      minItemY = Math.min(...spriteData.items.map((item) => item.y));
      maxItemY = Math.max(...spriteData.items.map((item) => item.y));
    }

    const scrollFactorY = Array.isArray(bgData.scrollFactor)
      ? (bgData.scrollFactor[1] ?? bgData.scrollFactor[0])
      : (bgData.scrollFactor?.y ?? bgData.scrollFactor?.x ?? 0.18);
    const maxScrollDeviation = Math.max(
      Math.abs(minItemY - height / 2),
      Math.abs(maxItemY - height / 2),
    );
    const parallaxPaddingY = maxScrollDeviation * scrollFactorY;

    const requiredHeight =
      height + parallaxPaddingY * 2 + this.gyroPaddingY * 2;
    const requiredWidth = width + this.gyroPaddingX * 2;

    this.baseX = width / 2;
    this.baseY = height / 2;

    this.bg = scene.add.sprite(this.baseX, this.baseY, "menuBackground");
    const bgZoomScale = Math.max(
      requiredWidth / this.bg.width,
      requiredHeight / this.bg.height,
    );
    this.bg
      .setScale(bgZoomScale)
      .setScrollFactor(bgData.scrollFactor)
      .setDepth(bgData.depth);

    this.flashSprite = scene.add.sprite(this.baseX, this.baseY, "menuFlash");
    this.flashSprite
      .setScale(bgZoomScale)
      .setScrollFactor(flashData.scrollFactor)
      .setDepth(flashData.depth);
    this.flashSprite.setVisible(false).setAlpha(1);

    this.handleOrientation = this.handleOrientation.bind(this);
    if (!scene.sys.game.device.os.desktop && window.DeviceOrientationEvent) {
      window.addEventListener("deviceorientation", this.handleOrientation);
      scene.input.once("pointerdown", () => {
        if (typeof DeviceOrientationEvent.requestPermission === "function") {
          DeviceOrientationEvent.requestPermission().catch(() => {});
        }
      });
    }
  }

  handleOrientation(event) {
    let gamma = event.gamma || 0;
    let beta = event.beta || 0;
    let xTilt = 0,
      yTilt = 0;

    const orientation =
      (screen.orientation || {}).angle || window.orientation || 0;

    if (orientation === 90 || orientation === -270) {
      xTilt = beta;
      yTilt = -gamma;
    } else if (orientation === -90 || orientation === 270) {
      xTilt = -beta;
      yTilt = gamma;
    } else {
      xTilt = gamma;
      yTilt = beta;
    }

    xTilt = Phaser.Math.Clamp(xTilt, -35, 35);
    yTilt = Phaser.Math.Clamp(yTilt, -35, 35);

    this.targetGyroOffsetX = (xTilt / 35) * this.gyroPaddingX;
    this.targetGyroOffsetY = (yTilt / 35) * this.gyroPaddingY;
  }

  update() {
    this.currentGyroOffsetX +=
      (this.targetGyroOffsetX - this.currentGyroOffsetX) * 0.08;
    this.currentGyroOffsetY +=
      (this.targetGyroOffsetY - this.currentGyroOffsetY) * 0.08;
    this.bg.x = this.baseX + this.currentGyroOffsetX;
    this.bg.y = this.baseY + this.currentGyroOffsetY;
    this.flashSprite.x = this.bg.x;
    this.flashSprite.y = this.bg.y;
  }

  destroy() {
    window.removeEventListener("deviceorientation", this.handleOrientation);
  }
}

funkin.ui.mainMenu.MainMenuBackground = MainMenuBackground;
