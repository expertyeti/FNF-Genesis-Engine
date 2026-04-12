/**
 * @file PhasePlaying.js
 * Fase 3: La canción está en curso. Se actualizan las notas, hits, y eventos de música.
 */

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.data = funkin.play.data || {};
funkin.play.data.referee = funkin.play.data.referee || {};

class PhasePlaying {
  constructor(referee) {
    this.referee = referee;
    this.scene = referee.scene;
  }

  async enter() {
    const scene = this.scene;

    if (scene.songPlaylist) {
      scene.songPlaylist.play("All");
    }

    scene.events.once("song_finished", () => {
      this.referee.changePhase("end");
    });
  }

  update(time, delta) {
    const scene = this.scene;

    if (!scene.isReady) return;

    if (window.funkin.controls) window.funkin.controls.update();
    if (scene.inputHandler) scene.inputHandler.update();
    if (scene.cameraDebug) scene.cameraDebug.update();

    if (scene.gameCam) scene.gameCam.update();
    if (scene.uiCam) scene.uiCam.update();
    if (scene.mainCam) scene.mainCam.update();

    if (scene.strumlines) scene.strumlines.update(time, delta);
    if (scene.sustainNotesManager) scene.sustainNotesManager.update(time, delta);
    if (scene.notesManager) scene.notesManager.update(time, delta);

    if (scene.judgmentPopUpManager) scene.judgmentPopUpManager.update(time, delta);
    if (scene.comboPopUpManager) scene.comboPopUpManager.update(time, delta);

    if (window.funkin.play && window.funkin.play.health) window.funkin.play.health.update(time, delta);
    if (scene.healthBar) scene.healthBar.update(time, delta);
    if (scene.antiLag) scene.antiLag.update(time, delta);
    
    // ==========================================
    // ACTUALIZADOR DEL SISTEMA DE SHADERS
    // ==========================================
    if (scene.shaderManager) scene.shaderManager.update(time, delta);

    if (scene.scoreText) scene.scoreText.update(time, delta);
    if (scene.botplayText) scene.botplayText.update(time, delta);

    if (window.funkin.conductor) {
      if (scene.songPlaylist && scene.songPlaylist.activeSounds && scene.songPlaylist.activeSounds.length > 0) {
        const mainTrack = scene.songPlaylist.activeSounds[0];

        if (mainTrack && mainTrack.isPlaying) {
          const audioTime = mainTrack.seek * 1000;
          const rate = mainTrack.totalRate || mainTrack.rate || 1.0;

          if (Math.abs(window.funkin.conductor.songPosition - audioTime) > 150) {
            window.funkin.conductor.songPosition = audioTime;
          } else {
            window.funkin.conductor.songPosition += delta * rate;
          }
        } else {
          window.funkin.conductor.songPosition += delta;
        }

        if (mainTrack && mainTrack.duration > 0) {
          const durationMs = mainTrack.duration * 1000;

          if (window.funkin.conductor.songPosition > durationMs + 1000) {
            if (!scene.songEndedFlag) {
              scene.songEndedFlag = true;
              scene.events.emit("song_finished");
            }
          }
        }
      } else {
        window.funkin.conductor.songPosition += delta;
      }

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
          if (scene.animateCharacters) scene.animateCharacters.onBeat(currentBeat);
        }
      }
    }
  }
}

funkin.play.data.referee.PhasePlaying = PhasePlaying;