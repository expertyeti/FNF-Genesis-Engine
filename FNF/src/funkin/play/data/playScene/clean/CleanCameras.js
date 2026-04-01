/**
 * @file src/funkin/play/data/playScene/clean/CleanCameras.js
 * Destruye las cámaras dinámicas y reinicia la principal.
 */

class CleanCameras {
    static execute(scene) {
        if (scene.gameCam) { scene.gameCam.destroy(); scene.gameCam = null; }
        if (scene.uiCam) { scene.uiCam.destroy(); scene.uiCam = null; }
        if (scene.mainCam) { scene.mainCam.destroy(); scene.mainCam = null; }
        
        if (scene.cameras) {
            scene.cameras.resetAll();
        }

        funkin.playCamera = {};
    }
}

funkin.play = funkin.play || {};
funkin.play.CleanCameras = CleanCameras;