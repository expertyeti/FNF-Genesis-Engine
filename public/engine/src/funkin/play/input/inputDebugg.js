window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.input = funkin.play.input || {};

class InputDebugg {
  constructor(scene) {
    this.scene = scene;
    this.isDestroyed = false;

    // Leer el valor desde el registro de Phaser
    let isPhaserRegistryDebug = false;
    if (this.scene && this.scene.game) {
      isPhaserRegistryDebug = this.scene.game.registry.get("debugMode") || false;
    }
    
    window.funkin.debugMode = isPhaserRegistryDebug;

    window.toggleEngineDebug = () => {
      window.funkin.debugMode = !window.funkin.debugMode;
      
      if (this.scene && this.scene.game) {
        this.scene.game.registry.set("debugMode", window.funkin.debugMode);
      }

      console.log("Engine Debug Mode: " + (window.funkin.debugMode ? "ACTIVADO" : "DESACTIVADO"));

      window.dispatchEvent(
        new CustomEvent("debugModeToggled", {
          detail: window.funkin.debugMode,
        })
      );
    };

    const storage = window.localStorage;
    if (storage) {
      const storedAutoplay = storage.getItem("funkin_autoplay");
      if (storedAutoplay !== null) {
        window.autoplay = storedAutoplay === "true";
      } else if (typeof window.autoplay === "undefined") {
        window.autoplay = false;
      }
    }

    this.debugKeyHandler = (e) => {
      if (!window.funkin.debugMode) return;

      if (e.altKey && !e.ctrlKey && !e.shiftKey && e.code === "KeyB") {
        e.preventDefault();
        window.autoplay = !window.autoplay;
        console.log("Autoplay: " + (window.autoplay ? "ENABLED" : "DISABLED"));
        if (storage) storage.setItem("funkin_autoplay", window.autoplay);
      }

      if (e.altKey && !e.ctrlKey && !e.shiftKey && e.code === "KeyS") {
        e.preventDefault();
        if (this.scene.scoreText) {
          const modes = ["left", "down", "right"];
          let currentIdx = modes.indexOf(this.scene.scoreText.alignMode);
          let nextIdx = (currentIdx + 1) % modes.length;

          this.scene.scoreText.alignMode = modes[nextIdx];
          this.scene.scoreText.setupPositioning(
            this.scene.scale.width,
            this.scene.scale.height
          );
          console.log("Score Text Position: " + modes[nextIdx].toUpperCase());
        }
      }

      // NUEVO: Alt + 7 para abrir el EditorScene
      if (e.altKey && !e.ctrlKey && !e.shiftKey && e.code === "Digit9") {
        e.preventDefault();
        // Evita abrir la escena múltiples veces si ya está activa
        if (!this.scene.scene.isActive("EditorScene")) {
          console.log("Abriendo EditorScene...");
          this.scene.scene.launch("EditorScene");
        }
      }
    };

    window.addEventListener("keydown", this.debugKeyHandler);
    this.scene.events.once("shutdown", this.destroy, this);
  }

  update() {}

  destroy() {
    if (this.isDestroyed) return;
    this.isDestroyed = true;
    window.toggleEngineDebug = undefined;

    if (this.debugKeyHandler) {
      window.removeEventListener("keydown", this.debugKeyHandler);
    }
    
    if (this.scene && this.scene.events) {
      this.scene.events.off("shutdown", this.destroy, this);
    }
  }
}

funkin.play.input.InputDebugg = InputDebugg;