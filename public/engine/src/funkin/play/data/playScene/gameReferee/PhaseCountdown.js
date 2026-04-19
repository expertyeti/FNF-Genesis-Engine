/**
 * @file PhaseCountdown.js
 * Fase 2: Cuenta regresiva visual antes de comenzar a reproducir la música.
 */
class PhaseCountdown {
  constructor(referee) {
    this.referee = referee;
    this.scene = referee.scene;
  }

  async enter() {
    const scene = this.scene;

    scene.events.once("countdown_finished", () => {
      this.referee.changePhase("playing");
    });

    let bpm = 100;
    if (funkin.play && funkin.play.chart && typeof funkin.play.chart.get === "function") {
        bpm = funkin.play.chart.get("metadata.audio.bpm") || 100;
    }
    const crochet = (60 / bpm) * 1000;
    
    if (funkin.conductor) {
        funkin.conductor.songPosition = -(crochet * 4);
    }

    if (scene.skipFade) {
        scene.skipFade = false; 
        
        if (scene.countDown) {
            if (typeof scene.countDown.destroy === "function") scene.countDown.destroy();
            scene.countDown.isInCountdown = true;
            scene.countDown.hasStarted = false;
            
            if (scene.isReady) scene.countDown.start();
        }
    } else {
        if (scene.cameras && scene.cameras.cameras) {
          scene.cameras.cameras.forEach((cam) => cam.fadeIn(800, 0, 0, 0));
        }

        scene.time.delayedCall(800, () => {
          if (scene.countDown && scene.countDown.startSong && scene.isReady) {
            scene.countDown.start();
          }
        });
    }
  }

  update(time, delta) {
    const scene = this.scene;
    if (!scene.isReady) return;

    if (scene.countDown && scene.countDown.isInCountdown && scene.countDown.hasStarted) {
        if (funkin.conductor) {
            funkin.conductor.songPosition += delta;
        }
    }

    if (funkin.controls) funkin.controls.update();
    if (scene.inputHandler) scene.inputHandler.update();
    if (scene.cameraDebug) scene.cameraDebug.update();

    if (scene.gameCam) scene.gameCam.update();
    if (scene.uiCam) scene.uiCam.update();
    if (scene.mainCam) scene.mainCam.update();

    if (scene.strumlines) scene.strumlines.update(time, delta);
    if (scene.notesManager) scene.notesManager.update(time, delta);
    if (scene.sustainNotesManager) scene.sustainNotesManager.update(time, delta);

    if (funkin.play && funkin.play.health) funkin.play.health.update(time, delta);
    if (scene.healthBar) scene.healthBar.update(time, delta);
    if (scene.scoreText) scene.scoreText.update(time, delta);

    if (window.funkin.conductor) {
      const bpmValue = typeof window.funkin.conductor.bpm.get === "function" ? window.funkin.conductor.bpm.get() : window.funkin.conductor.bpm;

      if (bpmValue > 0) {
        const crochet = (60 / bpmValue) * 1000;
        const currentBeat = Math.floor(window.funkin.conductor.songPosition / crochet);

        if (scene.lastBeat === undefined) {
          scene.lastBeat = currentBeat;
        }

        if (currentBeat !== scene.lastBeat) {
          scene.lastBeat = currentBeat;

          if (currentBeat % 4 === 0) {
            if (scene.gameCam && typeof scene.gameCam.bop === "function") {
              scene.gameCam.bop(0.015); 
            }
            if (scene.uiCam && typeof scene.uiCam.bop === "function") {
              scene.uiCam.bop(0.03); 
            }
          }

          if (window.funkin.play.playListSprites) window.funkin.play.playListSprites.onBeat(currentBeat);
          
          // EJECUCIÓN PURA DE ANIMACIONES BASADA EN EL NUEVO CHARACTERS MANAGER
          if (scene.activeCharacters) {
              scene.activeCharacters.forEach(char => {
                  if (char && typeof char.dance === 'function') {
                      char.dance();
                  }
              });
          }
        }
      }
    }
  }
}

funkin.play.data.referee.PhaseCountdown = PhaseCountdown;