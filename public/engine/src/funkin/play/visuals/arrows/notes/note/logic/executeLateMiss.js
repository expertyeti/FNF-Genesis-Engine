/**
 * @file src/funkin/play/visuals/arrows/notes/note/logic/executeLateMiss.js
 */
window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.arrows = funkin.play.visuals.arrows || {};
funkin.play.visuals.arrows.notes = funkin.play.visuals.arrows.notes || {};

funkin.play.visuals.arrows.notes.NoteLogic.prototype.executeLateMiss = function (note, timeDiff, isTimeJumping, isMyNoteAuto) {
    note.active = false;
    note.hasMissed = true;

    // En lugar de basarse en playAsOpponent global, basarse en LA NOTA original
    if (!isTimeJumping) {
        this.registerMiss(note.isPlayer, note.lane);
    }
};