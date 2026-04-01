/**
 * @file src/funkin/ui/Intro/GFDanceState/IntroDance.js
 */

class IntroDanceScene extends Phaser.Scene {
  constructor() {
    super({ key: "introDance" });
  }

  preload() {
    this.load.audio("confirmMenu", "public/sounds/confirmMenu.ogg");
    this.load.audio(
      "girlfriendsRingtone",
      "public/music/girlfriendsRingtone.ogg"
    );

    this.load.text("rainbowShader", "public/shaders/RainbowShader.frag");

    // PRECARGA DE INTERFAZ MÓVIL (Solo si NO es de escritorio)
    if (!this.sys.game.device.os.desktop) {
        this.load.atlasXML(
            "titleEnter_mobile", 
            "public/images/menu/intro/titleEnter_mobile.png", 
            "public/images/menu/intro/titleEnter_mobile.xml"
        );
    }
  }

  create() {
    // Descomentalo si tu UI lo utiliza en un futuro, es util mantenerlo aqui
    // let currentBpm = funkin.conductor.bpm.get();

    window.introDanceEventBus.emit("setup_animations", this);

    this.confirmSound = this.sound.add("confirmMenu");
    this.isTransitioning = false;
    
    // Variables para el control de Swipe en móviles
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.isSwiping = false;

    if (window.FunScript) {
      this.funScript = new window.FunScript(this);
    }

    if (!this.sys.game.device.os.desktop) {
        this.setupMobileControls();
    }

    this.input.keyboard.on('keydown-BACKSPACE', () => {
        if (typeof Neutralino !== 'undefined') {
            Neutralino.app.exit(); 
        }
    });
  }

  setupMobileControls() {
      // Guardamos la posición inicial al tocar
      this.input.on('pointerdown', (pointer) => {
          this.touchStartX = pointer.x;
          this.touchStartY = pointer.y;
          this.isSwiping = false;
      });

      // Evaluamos el movimiento al soltar el dedo
      this.input.on('pointerup', (pointer) => {
          const diffX = pointer.x - this.touchStartX;
          const diffY = pointer.y - this.touchStartY;

          // Si el movimiento es mayor a 50 píxeles, es un Swipe
          if (Math.abs(diffX) > 50 || Math.abs(diffY) > 50) {
              this.isSwiping = true;
              
              if (this.funScript && !this.funScript.active) {
                  // Determinar si el swipe fue más horizontal que vertical
                  if (Math.abs(diffX) > Math.abs(diffY)) {
                      this.funScript.checkInput(diffX > 0 ? 'RIGHT' : 'LEFT');
                  } else {
                      this.funScript.checkInput(diffY > 0 ? 'DOWN' : 'UP');
                  }
              }
          } else {
              // Si fue menor a 50 píxeles, es un simple Tap para continuar
              if (!this.isSwiping) {
                  this.acceptAction();
              }
          }
      });
  }

  update(time, delta) {
    if (funkin.controls) {
      funkin.controls.update();
    }

    if (this.funScript) {
      this.funScript.update();
    }

    if (this.isTransitioning) return;

    if (funkin.controls && funkin.controls.ACCEPT_P) {
        this.acceptAction();
    }
  }

  acceptAction() {
      if (this.isTransitioning) return;
      this.isTransitioning = true;

      window.introDanceEventBus.emit("play_confirm");
      this.confirmSound.play();

      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

      const flashScene = this.scene.get("FlashEffect");

      if (
        this.funScript &&
        this.funScript.active &&
        this.funScript.secretMusic
      ) {
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
      this.input.off('pointerdown');
      this.input.off('pointerup');
      this.input.keyboard.off('keydown-BACKSPACE');
  }
}

window.game.scene.add("introDance", IntroDanceScene);