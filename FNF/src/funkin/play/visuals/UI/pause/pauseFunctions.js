/**
 * @file src/funkin/play/visuals/UI/pause/pauseFunctions.js
 * Funciones modularizadas para el sistema de pausa de PlayScene.
 */

class PauseFunctions {
    static pause(pauseScene) {
        // Obsoleto / Migrado a PlayInput.js para lanzar la escena a voluntad
    }

    static resume(pauseScene) {
        const playScene = pauseScene.playScene;
        if (!playScene) return;

        // Desactiva el flag y reanuda la escena principal
        playScene.isGamePaused = false;
        playScene.sound.resumeAll();
        playScene.scene.resume("PlayScene");

        // Detenemos la UI de pausa completamente para liberar recursos
        pauseScene.scene.stop();
    }

    static exit(pauseScene) {
        const playScene = pauseScene.playScene;
        if (!playScene) return;

        // Reproducir sonido de cancelación si existe
        if (playScene.cache.audio.exists('cancelSound')) {
            playScene.sound.play('cancelSound');
        }

        // Recuperar la escena de origen o ir al menú principal por defecto
        const targetScene = (playScene.playData && playScene.playData.sourceScene) ? playScene.playData.sourceScene : "MainMenuScene";

        // Parar todos los sonidos actuales
        playScene.sound.stopAll();

        // Detenemos la UI de pausa y volvemos a la escena origen 
        pauseScene.scene.stop();
        playScene.scene.start(targetScene);
    }
}

funkin.PauseFunctions = PauseFunctions;
