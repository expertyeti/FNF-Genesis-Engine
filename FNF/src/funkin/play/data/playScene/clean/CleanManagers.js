/**
 * @file src/funkin/play/data/playScene/clean/CleanManagers.js
 * Limpia los procesadores de lógica y mecánicas del juego (notas, sustain, flechas).
 */

class CleanManagers {
    static execute(scene) {
        if (scene.sustainNotesManager) { scene.sustainNotesManager.destroy(); scene.sustainNotesManager = null; }
        if (scene.noteDirectionManager) { scene.noteDirectionManager.destroy(); scene.noteDirectionManager = null; }
        if (scene.notesManager) { scene.notesManager.destroy(); scene.notesManager = null; }
        if (scene.strumlines) { scene.strumlines.destroy(); scene.strumlines = null; }
    }
}

funkin.play = funkin.play || {};
funkin.play.CleanManagers = CleanManagers;