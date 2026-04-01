/**
 * @file src/funkin/play/data/playScene/clean/CleanUI.js
 * Limpia los managers de puntuación, popups e interfaz.
 */

class CleanUI {
    static execute(scene) {
        if (scene.playerStatics) { scene.playerStatics.destroy(); scene.playerStatics = null; }
        if (scene.judgmentPopUpManager) { scene.judgmentPopUpManager.destroy(); scene.judgmentPopUpManager = null; }
        if (scene.comboPopUpManager) { scene.comboPopUpManager.destroy(); scene.comboPopUpManager = null; }
        if (scene.noteSplashesManager) { scene.noteSplashesManager.destroy(); scene.noteSplashesManager = null; }
        if (scene.holdCoversManager) { scene.holdCoversManager.destroy(); scene.holdCoversManager = null; }
    }
}

funkin.play = funkin.play || {};
funkin.play.CleanUI = CleanUI;