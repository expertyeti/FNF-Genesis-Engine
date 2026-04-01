/**
 * Crea imágenes estáticas en el escenario basándose en la configuración del JSON.
 */
class CreateImages {
	/**
	 * @param {Phaser.Scene} scene 
	 * @param {string} stageName 
	 */
	static execute(scene, stageName) {
		if (funkin.play.options && funkin.play.options.simpleMode === true) {
			return;
		}

		const data = funkin.play.stageManager.get();
		if (!data || !data.stage) return;

		const pathName = data.pathName || stageName;

		data.stage.forEach((item) => {
			if (item.type === 'image' && item.namePath) {
				const cleanPath = item.namePath.endsWith('/') ? item.namePath.slice(0, -1) : item.namePath;
				const key = `stage_${pathName}_${cleanPath}`;
				
				if (!scene.textures.exists(key)) return;

				if (item.chromaKey && funkin.play && funkin.play.uiSkins) {
					funkin.play.uiSkins.applyChromaKey(scene, key, item.chromaKey);
				}

				const x = item.position ? item.position[0] : 0;
				const y = item.position ? item.position[1] : 0;
				const spr = scene.add.sprite(x, y, key);
				
				if (spr.texture && item.antialiasing === false) {
					spr.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
				}
				
				spr.setOrigin(item.origin ? item.origin[0] : 0, item.origin ? item.origin[1] : 0);
				spr.setScale(item.scale !== undefined ? item.scale : 1);
				
				if (item.rotate !== undefined) {
					spr.setAngle(item.rotate);
				}

				spr.setAlpha(item.opacity !== undefined ? item.opacity : 1);
				spr.setVisible(item.visible !== undefined ? item.visible : true);
				spr.setFlip(item.flip_x || false, item.flip_y || false);
				spr.setDepth(item.layer !== undefined ? item.layer : 0);
				
				if (item.scrollFactor !== undefined) {
					if (Array.isArray(item.scrollFactor)) spr.setScrollFactor(item.scrollFactor[0], item.scrollFactor[1]);
					else spr.setScrollFactor(item.scrollFactor);
				}

				const blendVal = item.blendMode || item.blend; // Adaptador doble de nomenclatura
				if (blendVal && funkin.play.BlendMode) funkin.play.BlendMode.apply(spr, blendVal);

				if (funkin.playCamera && typeof funkin.playCamera.addObjToGame === 'function') funkin.playCamera.addObjToGame(spr);
			}
		});
	}
}

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.CreateImages = CreateImages;