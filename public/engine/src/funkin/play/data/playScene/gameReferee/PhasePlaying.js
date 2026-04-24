window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.data = funkin.play.data || {};
funkin.play.data.referee = funkin.play.data.referee || {};

/**
 * Fase 3 del juego. Bucle principal de ejecución de pista, cámaras y lógica musical.
 */
class PhasePlaying {
  constructor(referee) {
    this.referee = referee;
    this.scene = referee.scene;
  }

  async enter() {
    this.scene.songPlaylist?.play("All");
    this.scene.events?.once("song_finished", () =>
      this.referee.changePhase("end"),
    );
  }

  update(time, delta) {
    if (!this.scene.isReady) return;

    const pos = window.funkin?.conductor?.songPosition || 0;

    // --- ACTUALIZADOR DE EVENTOS ---
    if (this.scene.eventManager) {
      this.scene.eventManager.update(pos);
    }

    window.funkin.controls?.update();
    this.scene.inputHandler?.update();
    this.scene.cameraDebug?.update();
    this.scene.gameCam?.update();
    this.scene.uiCam?.update();
    this.scene.mainCam?.update();
    this.scene.strumlines?.update(time, delta);
    this.scene.sustainNotesManager?.update(time, delta);
    this.scene.notesManager?.update(time, delta);
    this.scene.judgmentPopUpManager?.update(time, delta);
    this.scene.comboPopUpManager?.update(time, delta);

    // Actualizar la salud primero
    window.funkin.play?.health?.update(time, delta);

    // 🚨 DETECTOR DE MUERTE
    // Si la salud es 0 y no estamos en botplay, interrumpir y pasar al Game Over
    if (window.funkin.play?.health?.health <= 0 && !window.autoplay) {
      this.referee.changePhase("gameOver");
      return; // VITAL: Evita que el juego siga avanzando en este frame
    }

    this.scene.healthBar?.update(time, delta);
    this.scene.antiLag?.update(time, delta);
    this.scene.shaderManager?.update(time, delta);
    this.scene.scoreText?.update(time, delta);
    this.scene.botplayText?.update(time, delta);
    this.scene.animateCharacters?.update(time, delta);

    const conductor = window.funkin.conductor;
    if (!conductor) return;

    const mainTrack = this.scene.songPlaylist?.activeSounds?.[0];
    if (mainTrack?.isPlaying) {
      const audioTime = mainTrack.seek * 1000;
      if (Math.abs(conductor.songPosition - audioTime) > 150)
        conductor.songPosition = audioTime;
      else
        conductor.songPosition +=
          delta * (mainTrack.totalRate || mainTrack.rate || 1.0);

      if (
        mainTrack.duration > 0 &&
        conductor.songPosition > mainTrack.duration * 1000 + 1000 &&
        !this.scene.songEndedFlag
      ) {
        this.scene.songEndedFlag = true;
        this.scene.events?.emit("song_finished");
      }
    } else {
      conductor.songPosition += delta;
    }

    const bpmValue = conductor.bpm?.get?.() ?? conductor.bpm;
    if (bpmValue > 0) {
      const currentBeat = Math.floor(
        conductor.songPosition / ((60 / bpmValue) * 1000),
      );

      if (currentBeat !== (this.scene.lastBeat ?? -1)) {
        this.scene.lastBeat = currentBeat;

        if (currentBeat % 4 === 0) {
          this.scene.gameCam?.bop?.(0.015);
          this.scene.uiCam?.bop?.(0.03);
        }

        window.funkin.play.playListSprites?.onBeat(currentBeat);

        if (this.scene.animateCharacters?.onBeat) {
          this.scene.animateCharacters.onBeat(currentBeat);
        } else {
          this.scene.activeCharacters?.forEach((char) => char?.dance?.());
        }
      }
    }
  }
}

funkin.play.data.referee.PhasePlaying = PhasePlaying;
