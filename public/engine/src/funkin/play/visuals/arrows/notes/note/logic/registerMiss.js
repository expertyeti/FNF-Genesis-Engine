/**
 * @file src/funkin/play/visuals/arrows/notes/note/logic/registerMiss.js
 */
window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.arrows = funkin.play.visuals.arrows || {};
funkin.play.visuals.arrows.notes = funkin.play.visuals.arrows.notes || {};

/**
 * Emits failure properties when interactions do not overlap valid notes.
 * @param {boolean} isPlayerSide Determina quién ha fallado la nota
 * @param {number} lane La línea en la que se ha fallado
 */
funkin.play.visuals.arrows.notes.NoteLogic.prototype.registerMiss = function(
  isPlayerSide,
  lane
) {
  const missData = {
    pressed: true,
    ms: 0,
    absMs: 0,
    judgment: "miss",
    score: -10,
    direction: lane,
    isPlayer: isPlayerSide, // CRÍTICO: Debe ser el lado original, P1 o P2.
    isAuto: false
  };

  if (funkin.playNotes) {
    funkin.playNotes.lastHit = missData;
    funkin.playNotes.emit("noteMiss", missData);
  }

  if (this.playMissSound) {
      this.playMissSound(isPlayerSide, false);
  }

  const scene = this.scene || (this.manager && this.manager.scene);
  if (scene && scene.animateCharacters) {
    scene.animateCharacters.playMiss(isPlayerSide, lane);
  }
};