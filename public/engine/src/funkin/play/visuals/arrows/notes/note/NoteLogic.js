// src/funkin/play/visuals/arrows/notes/note/NoteLogic.js
/**
 * Base NoteLogic class container for Genesis Engine prototype pattern.
 */
class NoteLogic {
  constructor(manager) {
    this.manager = manager;
    this.scene = manager.scene;
  }
}
funkin.play.visuals.arrows.notes.NoteLogic = NoteLogic;