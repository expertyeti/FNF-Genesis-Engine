// src/funkin/play/visuals/arrows/notes/note/logic/update.js
/**
 * Main update lifecycle for checking inputs and distance.
 */
funkin.play.visuals.arrows.notes.NoteLogic.prototype.update = function (time, delta) {
  if (!funkin.conductor || this.manager.notes.length === 0) return;

  const songPos = funkin.conductor.songPosition;
  const playAsOpponent = funkin.play.options && funkin.play.options.playAsOpponent;
  const isMobileMode = funkin.play.options && funkin.play.options.middlescroll === "mobile";

  if (isMobileMode && this.scene.hitbox && this.scene.hitbox.visible !== false) {
    if (typeof this.scene.hitbox.setVisible === "function") this.scene.hitbox.setVisible(false);
    else this.scene.hitbox.visible = false;
  }

  let isTimeJumping = false;
  if (this.manager.lastSongPos !== undefined) {
    if (Math.abs(songPos - this.manager.lastSongPos) > 300) isTimeJumping = true;
  }
  this.manager.lastSongPos = songPos;

  // FIX: Extraer correctamente 'scrollSpeed' de la nueva estructura del chart.
  if (funkin.play && funkin.play.chart) {
    const chartSpeed = funkin.play.chart.get("metadata.scrollSpeed") || funkin.play.chart.get("metadata.speed");
    if (chartSpeed !== undefined && chartSpeed !== null) {
      this.manager.scrollSpeed = chartSpeed;
    } else {
      this.manager.scrollSpeed = 1.0;
    }
  }

  this.handleRewind(songPos);
  this.processInputs(songPos, playAsOpponent, time);
  this.updateMovement(songPos, playAsOpponent, isTimeJumping, time);
};