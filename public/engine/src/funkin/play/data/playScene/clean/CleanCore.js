/**
 * @file CleanCore.js
 * Limpia el estado interno de la escena, inputs y eventos base.
 */
class CleanCore {
    static execute(scene) {
        scene.scene.stop("PauseSubScene");
        scene.isReady = false;

        if (scene.game && scene.game.events) {
            scene.game.events.off('blur', scene.onFocusLost, scene);
        }

        if (scene.inputHandler && typeof scene.inputHandler.destroy === "function") {
            scene.inputHandler.destroy();
        }
        scene.inputHandler = null;

        if (scene.children) {
            scene.children.removeAll(true);
        }
        
        // Referencias a sustains
        if (funkin.play.visuals && funkin.play.visuals.arrows && funkin.play.visuals.arrows.notes && funkin.play.visuals.arrows.notes.SustainAPI) {
            funkin.play.visuals.arrows.notes.SustainAPI._listeners = {};
        }

        if (funkin.play && funkin.play.session && typeof funkin.play.session.clearCustomData === "function") {
            funkin.play.session.clearCustomData();
        }
    }
}

funkin.play.data.clean.CleanCore = CleanCore;