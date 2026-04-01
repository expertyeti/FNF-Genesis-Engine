/**
 * Coordinador maestro para la limpieza completa de PlayScene.
 * Libre de dependencias hacia los personajes.
 */
class PlayCleanUp {
	/**
	 * @param {Phaser.Scene} scene
	 */
	static execute(scene) {
		if (funkin.play.CleanManagers) funkin.play.CleanManagers.execute(scene);
		if (funkin.play.CleanUI) funkin.play.CleanUI.execute(scene);
		if (funkin.play.CleanCameras) funkin.play.CleanCameras.execute(scene);
		if (funkin.play.CleanAudio) funkin.play.CleanAudio.execute(scene);
		if (funkin.play.CleanCore) funkin.play.CleanCore.execute(scene);

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

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.PlayCleanUp = PlayCleanUp;
funkin.PlayCleanUp = PlayCleanUp;