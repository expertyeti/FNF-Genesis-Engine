// src/funkin/play/visuals/arrows/notes/note/logic/registerHit.js
/**
 * Processes scoring mapping algorithms when a note registers correctly.
 */
funkin.play.visuals.arrows.notes.NoteLogic.prototype.registerHit = function (closestNote, closestTime, lane, time) {
  const absMs = Math.abs(closestTime);
  let judgment = "shit";
  let score = 50;

  if (absMs <= 5.0) {
    judgment = "perfect";
    score = 500;
  } else if (absMs <= 45.0) {
    judgment = "sick";
    score = 350;
  } else if (absMs <= 90.0) {
    judgment = "good";
    score = 200;
  } else if (absMs <= 135.0) {
    judgment = "bad";
    score = 100;
  } else {
    judgment = "shit";
    score = 50;
  }

  closestNote.wasHit = true;
  closestNote.active = false;
  closestNote.visible = false;
  closestNote.alpha = 0;

  funkin.playNotes.lastHit = {
    pressed: true,
    ms: closestTime,
    absMs: absMs,
    judgment: judgment,
    score: score,
    direction: lane,
    isPlayer: closestNote.isPlayer,
    isAuto: false,
  };
  funkin.playNotes.emit("noteHit", funkin.playNotes.lastHit);

  if (this.scene.animateCharacters) {
    this.scene.animateCharacters.sing(closestNote.isPlayer, lane);
  }

  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(15);
  }

  if (this.manager.strumlines) {
    const strums = closestNote.isPlayer
      ? this.manager.strumlines.playerStrums
      : this.manager.strumlines.opponentStrums;
    const arrow = strums[lane];
    if (arrow && arrow.playAnim) {
      arrow.playAnim("confirm", true);
      arrow.resetTime = time + 150;
    }
  }
};