var funkin = window.funkin || {};
funkin.play = funkin.play || {};

class InputDebugg {
  constructor(scene) {
    this.scene = scene;
    this.isTransitioning = false; 

    const storage = typeof window !== "undefined" ? window.localStorage : null;

    if (storage) {
      const storedDebug = storage.getItem("funkin_debugMode");
      if (storedDebug !== null) {
        funkin.debugMode = (storedDebug === "true");
      } else if (typeof funkin.debugMode === "undefined") {
        funkin.debugMode = false;
      }

      const storedAutoplay = storage.getItem("funkin_autoplay");
      if (storedAutoplay !== null) {
        window.autoplay = (storedAutoplay === "true");
      } else if (typeof window.autoplay === "undefined") {
        window.autoplay = false;
      }
    } else {
      if (typeof funkin.debugMode === "undefined") funkin.debugMode = false;
      if (typeof window.autoplay === "undefined") window.autoplay = false;
    }

    this.debugKeyHandler = (e) => {
      if (e.ctrlKey && e.altKey && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault(); 
        funkin.debugMode = !funkin.debugMode;
        console.log("Modo Debug:", funkin.debugMode ? "ACTIVADO" : "DESACTIVADO");
        
        if (storage) storage.setItem("funkin_debugMode", funkin.debugMode);
        
        if (!funkin.debugMode) {
          window.autoplay = false;
          if (storage) storage.setItem("funkin_autoplay", false);
        }
        
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("debugModeToggled", { detail: funkin.debugMode }));
        }
      }

      if (funkin.debugMode && e.key.toLowerCase() === "b") {
        e.preventDefault();
        window.autoplay = !window.autoplay;
        console.log("Autoplay:", window.autoplay ? "ACTIVADO" : "DESACTIVADO");
        
        if (storage) storage.setItem("funkin_autoplay", window.autoplay);
      }

      // Hotkey para cambiar la posicion de los stats: Shift + Alt + A
      if (funkin.debugMode && e.shiftKey && e.altKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        if (this.scene.scoreText) {
          const modes = ["left", "down", "right"];
          let currentIdx = modes.indexOf(this.scene.scoreText.alignMode);
          let nextIdx = (currentIdx + 1) % modes.length;
          
          this.scene.scoreText.alignMode = modes[nextIdx];
          this.scene.scoreText.setupPositioning(this.scene.scale.width, this.scene.scale.height);
          console.log("Score Text Position:", modes[nextIdx]);
        }
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("keydown", this.debugKeyHandler);
    }
  }

  update() {
    if (this.isTransitioning || this.scene.isGamePaused) return;
    if (!funkin.controls) return;

    const backHit = funkin.controls.BACK_P;

    if (backHit && !this.isTransitioning) {
      this.isTransitioning = true;
      
      if (this.scene.cache.audio.exists("cancelSound")) {
        this.scene.sound.play("cancelSound");
      }
      
      let referee = this.scene.referee || this.scene.gameReferee || (funkin.play && funkin.play.gameReferee);
      
      if (referee) {
        console.log("[InputDebugg] Forzando salida limpia mediante PhaseEnd del GameReferee...");
        
        if (this.scene.playData && this.scene.playData.songPlayList) {
          this.scene.playData.songPlayList = [];
        }
        
        referee.changePhase("end");
      } else {
        console.warn("[InputDebugg] No se encontró GameReferee (this.referee). Usando salida de emergencia...");
        this.emergencyExit();
      }
    }
  }

  emergencyExit() {
    if (this.scene.sound) {
      this.scene.sound.stopAll();
    }

    const targetScene = (this.scene.playData && this.scene.playData.sourceScene) ? this.scene.playData.sourceScene : "MainMenuScene";
    const transition = this.scene.scene.get("TransitionScene");

    if (transition) {
      if (!transition.scene.isActive() || !transition.blackScreen) {
        this.scene.scene.launch("TransitionScene");
        transition.events.once("create", () => { transition.startTransition(targetScene); });
      } else { 
        transition.startTransition(targetScene); 
      }
    } else { 
      this.scene.scene.start(targetScene); 
    }
  }

  destroy() {
    if (typeof window !== "undefined" && this.debugKeyHandler) {
      window.removeEventListener("keydown", this.debugKeyHandler);
    }
  }
}

funkin.play.InputDebugg = InputDebugg;