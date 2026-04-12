/**
 * @file CleanCameras.js
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

        // Limpiamos el nuevo namespace de las cámaras
        if (funkin.play.data.camera) {
            funkin.play.data.camera.game = null;
            funkin.play.data.camera.ui = null;
            funkin.play.data.camera.main = null;
        }
    }
}

funkin.play.data.clean.CleanCameras = CleanCameras;