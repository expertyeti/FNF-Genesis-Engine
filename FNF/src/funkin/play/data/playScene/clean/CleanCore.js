/**
 * @file src/funkin/play/data/playScene/clean/CleanCore.js
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
        
        if (funkin.playSustains) {
            funkin.playSustains._listeners = {};
        }

        if (funkin.play && funkin.play.session && typeof funkin.play.session.clearCustomData === "function") {
            funkin.play.session.clearCustomData();
        }
    }
}

funkin.play = funkin.play || {};
funkin.play.CleanCore = CleanCore;