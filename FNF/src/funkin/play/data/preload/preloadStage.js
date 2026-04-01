/**
 * Se encarga de precargar los recursos graficos del escenario.
 */
class PreloadStage {
	/**
	 * @param {Phaser.Scene} scene Escena activa
	 * @param {string} stageName ID del escenario a usar
	 */
	static async preload(scene, stageName) {
		return new Promise((resolve) => {
			if (funkin.play.options && funkin.play.options.simpleMode === true) {
				console.log('Anulando lectura de assets de escenario por modo simple activado.');
				return resolve();
			}

			const data = funkin.play.stageManager.get();
			if (!data) return resolve();

			const pathName = data.pathName || stageName;
			let assetsToLoad = 0;

			if (data.background && typeof data.background === 'string' && !data.background.startsWith('#')) {
				const bgKey = `bg_${pathName}`;
				if (!scene.textures.exists(bgKey)) {
					scene.load.image(bgKey, `public/images/stages/${pathName}/${data.background}.png`);
					assetsToLoad++;
				}
			}

			if (data.stage && Array.isArray(data.stage)) {
				data.stage.forEach((item) => {
					if (!item.namePath) return;

					const cleanPath = item.namePath.endsWith('/') ? item.namePath.slice(0, -1) : item.namePath;
					const key = item.image || item.name || (cleanPath ? `stage_${pathName}_${cleanPath}` : `stage_${pathName}`);
					const basePath = `public/images/stages/${pathName}/${cleanPath}`;
					const type = (item.type || '').toLowerCase();

					if (type === 'image') {
						if (!scene.textures.exists(key)) {
							scene.load.image(key, `${basePath}.png`);
							assetsToLoad++;
						}
					} else if (type === 'spritesheet') {
						if (!scene.textures.exists(key)) {
							scene.load.atlasXML(key, `${basePath}.png`, `${basePath}.xml`);
							scene.load.text(`${key}_rawXML`, `${basePath}.xml`);
							assetsToLoad += 2;
						}
					}
				});
			}

			if (assetsToLoad === 0) return resolve();

			scene.load.once('complete', () => {
				resolve();
			});

			scene.load.start();
		});
	}
}

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.PreloadStage = PreloadStage;