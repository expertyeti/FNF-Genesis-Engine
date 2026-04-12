/**
 * @file playCleanUp.js
 * Coordinador maestro para la limpieza completa de PlayScene.
 */
class PlayCleanUp {
	static execute(scene) {
        const clean = funkin.play.data.clean;

		if (clean.CleanManagers) clean.CleanManagers.execute(scene);
		if (clean.CleanUI) clean.CleanUI.execute(scene);
		if (clean.CleanCameras) clean.CleanCameras.execute(scene);
		if (clean.CleanAudio) clean.CleanAudio.execute(scene);
		if (clean.CleanCore) clean.CleanCore.execute(scene);

        if (scene && scene.characterAnimManager) {
            if (typeof scene.characterAnimManager.destroy === 'function') {
                scene.characterAnimManager.destroy();
            }
            scene.characterAnimManager = null;
        }

        if (scene && scene.stageCharacters) {
            scene.stageCharacters = null;
        }

		if (funkin.play) {
			funkin.play.currentScene = null;
			funkin.play.health = null;
		}

		if (scene) {
			if (scene.load) scene.load.off("complete");
			scene.referee = null;
			scene.isReady = false;
		}
	}
}

funkin.play.data.clean.PlayCleanUp = PlayCleanUp;
funkin.PlayCleanUp = PlayCleanUp;