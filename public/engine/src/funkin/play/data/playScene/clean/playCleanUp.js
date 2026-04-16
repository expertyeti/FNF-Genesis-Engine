/**
 * @file playCleanUp.js
 * Coordinador maestro para la limpieza completa de PlayScene.
 */
class PlayCleanUp {
	static execute(scene) {
        const clean = funkin.play.data.clean;

        // 1. Limpiar sub-sistemas, Managers, UI, cámaras y Audio PRIMERO
		if (clean.CleanManagers) clean.CleanManagers.execute(scene);
		if (clean.CleanUI) clean.CleanUI.execute(scene);
		if (clean.CleanCameras) clean.CleanCameras.execute(scene);
		if (clean.CleanAudio) clean.CleanAudio.execute(scene);

        // 2. Limpiar personajes explícitamente ANTES del nuke de la escena
        if (scene && scene.stageCharacters) {
            const groups = Object.values(scene.stageCharacters);
            
            groups.forEach(group => {
                const charArray = Array.isArray(group) ? group : [group];
                
                charArray.forEach(char => {
                    // Phaser cambia active a 'false' si el objeto ya fue destruido.
                    // Esto evita tocar "fantasmas".
                    if (char && char.active !== false) {
                        if (typeof char.stop === 'function') char.stop();
                        if (char.scene && char.scene.tweens) char.scene.tweens.killTweensOf(char);
                        
                        if (typeof char.destroy === 'function') {
                            char.destroy(true); 
                        }
                    }
                });
            });

            scene.stageCharacters = null;
        }

        // 3. Destruir el AnimManager ahora que los personajes ya fueron procesados
        if (scene && scene.characterAnimManager) {
            if (typeof scene.characterAnimManager.destroy === 'function') {
                scene.characterAnimManager.destroy();
            }
            scene.characterAnimManager = null;
        }

        // 4. EL NUKE FINAL (scene.children.removeAll(true) ocurre aquí)
		if (clean.CleanCore) clean.CleanCore.execute(scene);

		if (funkin.play) {
			funkin.play.currentScene = null;
			funkin.play.health = null;
            
            // Reiniciar caché para evitar memory leaks de texturas
            if (funkin.play.preload && funkin.play.preload.characters) {
                funkin.play.preload.characters.loadedKeys = { opponents: [], players: [], spectator: [] };
            }
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