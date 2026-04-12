window.funkin = window.funkin || {};
funkin.playDebugging = funkin.playDebugging || {};

class SimpleModeDebug {
  constructor(scene) {
    this.scene = scene;
    this.isDestroyed = false;

    if (!this.scene || !this.scene.input || !this.scene.input.keyboard) return;

    this.handleKeyDown = this.onKeyDown.bind(this);
    this.scene.input.keyboard.on("keydown", this.handleKeyDown);
    
    this.scene.events.once("shutdown", this.destroy, this);
  }

  onKeyDown(event) {
    if (window.funkin.debugMode && event.altKey && event.code === "KeyZ") {
      window.funkin.play.options = window.funkin.play.options || {};
      window.funkin.play.options.simpleMode = !window.funkin.play.options.simpleMode;

      console.log("Simple mode: " + (window.funkin.play.options.simpleMode ? "ON" : "OFF"));

      if (this.scene && this.scene.scene) {
        this.scene.scene.restart();
      }
    }
  }

  destroy() {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    if (this.scene && this.scene.input && this.scene.input.keyboard) {
      this.scene.input.keyboard.off("keydown", this.handleKeyDown);
    }

    if (this.scene && this.scene.events) {
      this.scene.events.off("shutdown", this.destroy, this);
    }
  }
}

funkin.playDebugging.SimpleModeDebug = SimpleModeDebug;