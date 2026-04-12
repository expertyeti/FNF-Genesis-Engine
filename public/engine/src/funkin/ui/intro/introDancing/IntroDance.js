class IntroDanceScene extends Phaser.Scene {
  constructor() {
    super({ key: "introDance" });
  }

  preload() {
    this.load.imageBitmapFormat = true;
    // Si ya los precargas en loading.js puedes omitirlos aquí, pero no está de más
    this.load.audio(
      "confirmMenu",
      window.BASE_URL + "assets/sounds/confirmMenu.ogg",
    );
    this.load.audio(
      "girlfriendsRingtone",
      window.BASE_URL + "assets/music/girlfriendsRingtone.ogg",
    );
    this.load.text(
      "rainbowShader",
      window.BASE_URL + "assets/shaders/RainbowShader.frag",
    );

    if (!this.sys.game.device.os.desktop) {
      this.load.atlasXML(
        "titleEnter_mobile",
        window.BASE_URL + "assets/images/menu/intro/titleEnter_mobile.png",
        window.BASE_URL + "assets/images/menu/intro/titleEnter_mobile.xml",
      );
    }
  }

  create() {
    // Usando el namespace del bus
    funkin.ui.intro.danceEventBus.emit("setup_animations", this);

    this.confirmSound = this.sound.add("confirmMenu");
    this.isTransitioning = false;

    this.touchStartX = 0;
    this.touchStartY = 0;
    this.isSwiping = false;

    // Instanciando desde el namespace
    if (funkin.ui.intro.FunScript) {
      this.funScript = new funkin.ui.intro.FunScript(this);
    }

    if (!this.sys.game.device.os.desktop) {
      this.setupMobileControls();
    }

    this.input.keyboard.on("keydown-BACKSPACE", () => {
      if (typeof Neutralino !== "undefined") Neutralino.app.exit();
    });
  }

  setupMobileControls() {
    this.input.on("pointerdown", (pointer) => {
      this.touchStartX = pointer.x;
      this.touchStartY = pointer.y;
      this.isSwiping = false;
    });

    this.input.on("pointerup", (pointer) => {
      const diffX = pointer.x - this.touchStartX;
      const diffY = pointer.y - this.touchStartY;

      if (Math.abs(diffX) > 50 || Math.abs(diffY) > 50) {
        this.isSwiping = true;
        if (this.funScript && !this.funScript.active) {
          if (Math.abs(diffX) > Math.abs(diffY)) {
            this.funScript.checkInput(diffX > 0 ? "RIGHT" : "LEFT");
          } else {
            this.funScript.checkInput(diffY > 0 ? "DOWN" : "UP");
          }
        }
      } else {
        if (!this.isSwiping) this.acceptAction();
      }
    });
  }

  update(time, delta) {
    if (funkin.controls) funkin.controls.update();
    if (this.funScript) this.funScript.update();

    if (this.isTransitioning) return;

    if (funkin.controls && funkin.controls.ACCEPT_P) {
      this.acceptAction();
    }
  }

  acceptAction() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    funkin.ui.intro.danceEventBus.emit("play_confirm");
    this.confirmSound.play();

    try {
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    } catch (e) {}

    const flashScene = this.scene.get("FlashEffect");

    if (this.funScript && this.funScript.active && this.funScript.secretMusic) {
      this.funScript.secretMusic.stop();
    }

    if (flashScene) {
      flashScene.isTransitioning = false;
      flashScene.tweens.killTweensOf(flashScene.whiteScreen);
      flashScene.startTransition("MainMenuScene");
    } else {
      this.scene.start("MainMenuScene");
    }
  }

  shutdown() {
    this.input.off("pointerdown");
    this.input.off("pointerup");
    this.input.keyboard.off("keydown-BACKSPACE");
  }
}

funkin.ui.intro.IntroDanceScene = IntroDanceScene;
window.game.scene.add("introDance", IntroDanceScene);
