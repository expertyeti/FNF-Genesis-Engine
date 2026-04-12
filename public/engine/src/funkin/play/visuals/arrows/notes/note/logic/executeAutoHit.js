// src/funkin/play/visuals/arrows/notes/note/logic/executeAutoHit.js
/**
 * Automatically clears note hitting when autoplay or non-player side interactions are met.
 */
funkin.play.visuals.arrows.notes.NoteLogic.prototype.executeAutoHit = function (
  note,
  timeDiff,
  isTimeJumping,
  time,
  isMyNoteAuto
) {
  note.wasHit = true;
  note.active = false;
  note.visible = false;
  note.alpha = 0;

  if (!isTimeJumping && this.manager.strumlines) {
    const strums = note.isPlayer ? this.manager.strumlines.playerStrums : this.manager.strumlines.opponentStrums;
    const arrow = strums[note.lane];
    if (arrow && arrow.playAnim) {
      arrow.playAnim("confirm", true);
      const extraTime = note.length && note.length > 0 ? note.length : 150;
      arrow.resetTime = time + extraTime;
    }
  }

  funkin.playNotes.lastHit = {
    pressed: true,
    ms: timeDiff,
    absMs: Math.abs(timeDiff),
    judgment: "perfect",
    score: isMyNoteAuto ? 500 : 0,
    direction: note.lane,
    isPlayer: note.isPlayer,
    isAuto: !isMyNoteAuto,
  };
  funkin.playNotes.emit("noteHit", funkin.playNotes.lastHit);

  if (this.scene.animateCharacters) {
    this.scene.animateCharacters.sing(note.isPlayer, note.lane);
  }

  if (isMyNoteAuto && typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(15);
  }
};