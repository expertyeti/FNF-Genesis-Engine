class SimpleModeDebug {
  /**
   * @param {Phaser.Scene} scene 
   */
  constructor(scene) {
    this.scene = scene;

    if (!this.scene || !this.scene.input || !this.scene.input.keyboard) return;

    this.keyS = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyShift = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

    this.handleKeyDown = this.onKeyDown.bind(this);
    this.scene.input.keyboard.on("keydown", this.handleKeyDown);
  }

  /**
   * @param {KeyboardEvent} event 
   */
  onKeyDown(event) {
    if (this.keyShift.isDown && event.keyCode === Phaser.Input.Keyboard.KeyCodes.S) {
      funkin.play.options = funkin.play.options || {};
      funkin.play.options.simpleMode = !funkin.play.options.simpleMode;

      console.log("Modo simple cambiado a", funkin.play.options.simpleMode);

      if (this.scene && this.scene.scene) {
        this.scene.scene.restart();
      }
    }
  }

  destroy() {
    if (this.scene && this.scene.input && this.scene.input.keyboard) {
      this.scene.input.keyboard.off("keydown", this.handleKeyDown);
    }
  }
}

if (typeof window !== "undefined") {
  window.funkin = window.funkin || {};
  funkin.playDebugging = funkin.playDebugging || {};
  funkin.playDebugging.SimpleModeDebug = SimpleModeDebug;
}