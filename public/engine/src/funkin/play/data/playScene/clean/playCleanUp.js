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
        // ARREGLO: Se usa la variable correcta 'activeCharacters' en lugar del obsoleto 'stageCharacters'
        if (scene && scene.activeCharacters) {
            scene.activeCharacters.forEach(char => {
                if (char && char.active !== false) {
                    if (typeof char.stop === 'function') char.stop();
                    if (char.scene && char.scene.tweens) char.scene.tweens.killTweensOf(char);
                    
                    // Limpiar el timeout de canto si existe para evitar llamadas fantasma
                    if (char.singTimeout && scene.time) {
                        scene.time.removeEvent(char.singTimeout);
                        char.singTimeout = null;
                    }
                    
                    if (typeof char.destroy === 'function') {
                        char.destroy(true); 
                    }
                }
            });
            scene.activeCharacters = null;
        }

        // Limpiar referencias individuales
        ['player', 'opponent', 'spectator'].forEach(role => {
            if (scene && scene[role]) {
                if (scene[role].active !== false && typeof scene[role].destroy === 'function') {
                    scene[role].destroy(true);
                }
                scene[role] = null;
            }
        });

        // 3. Destruir la lógica de animaciones de los personajes
        if (scene && scene.animateCharacters) {
            if (typeof scene.animateCharacters.cleanUp === 'function') {
                scene.animateCharacters.cleanUp();
            }
            scene.animateCharacters = null;
        }

        if (scene && scene.characterAnimManager) {
            if (typeof scene.characterAnimManager.destroy === 'function') {
                scene.characterAnimManager.destroy();
            }
            scene.characterAnimManager = null;
        }

        // 4. EL NUKE FINAL (scene.children.removeAll(true) ocurre aquí)
		if (clean.CleanCore) clean.CleanCore.execute(scene);

        // 5. Limpieza profunda de Datos Globales y Memoria VRAM
		if (funkin.play) {
			funkin.play.currentScene = null;
			funkin.play.health = null;
            
            // Vaciar los metadatos de los personajes cargados de la canción anterior
            if (funkin.play.characterLoader) {
                funkin.play.characterLoader.charactersData = { opponents: [], players: [], spectator: [] };
            }

            // ARREGLO: Destruir físicamente las texturas de la memoria de Phaser
            if (funkin.play.preload && funkin.play.preload.characters && funkin.play.preload.characters.loadedKeys) {
                const keys = funkin.play.preload.characters.loadedKeys;
                if (scene && scene.textures) {
                    ['opponents', 'players', 'spectator'].forEach(group => {
                        keys[group].forEach(charInfo => {
                            if (charInfo.key && scene.textures.exists(charInfo.key)) {
                                scene.textures.remove(charInfo.key);
                            }
                        });
                    });
                }
                // Reiniciar el tracker de llaves
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