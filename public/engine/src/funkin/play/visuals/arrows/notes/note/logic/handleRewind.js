// src/funkin/play/visuals/arrows/notes/note/logic/handleRewind.js
/**
 * Recovers notes properties when playback position rewinds.
 */
funkin.play.visuals.arrows.notes.NoteLogic.prototype.handleRewind = function (songPos) {
  this.manager.notes.forEach((note) => {
    const timeDiff = note.noteTime - songPos;
    if (timeDiff > 166.0 && (note.wasHit || note.hasMissed)) {
      note.wasHit = false;
      note.hasMissed = false;
      note.visible = true;
      note.active = true;
      note.alpha = note.baseAlpha;
      note.clearTint();
    }
  });
};