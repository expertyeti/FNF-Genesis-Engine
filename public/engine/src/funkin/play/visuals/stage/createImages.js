class CreateImages {
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
                
                // Llave sincronizada con preloadStage
				const key = item.image || item.name || (cleanPath ? `stage_${pathName}_${cleanPath}` : `stage_${pathName}`);
				
				if (!scene.textures.exists(key)) return;

				if (item.chromaKey && funkin.play && funkin.play.uiSkins) {
					funkin.play.uiSkins.applyChromaKey(scene, key, item.chromaKey);
				}

				const x = item.position ? item.position[0] : 0;
				const y = item.position ? item.position[1] : 0;
                
				const img = scene.add.image(x, y, key);
				
				if (img.texture && item.antialiasing === false) {
					img.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
				}
				
				img.setOrigin(item.origin ? item.origin[0] : 0, item.origin ? item.origin[1] : 0);
				img.setScale(item.scale !== undefined ? item.scale : 1);
				
				if (item.rotate !== undefined) {
					img.setAngle(item.rotate);
				}

				img.setAlpha(item.opacity !== undefined ? item.opacity : 1);
				img.setVisible(item.visible !== undefined ? item.visible : true);
				img.setFlip(item.flip_x || false, item.flip_y || false);
				img.setDepth(item.layer !== undefined ? item.layer : 0);
				
				if (item.scrollFactor !== undefined) {
					if (Array.isArray(item.scrollFactor)) img.setScrollFactor(item.scrollFactor[0], item.scrollFactor[1]);
					else img.setScrollFactor(item.scrollFactor);
				}

				const blendVal = item.blendMode || item.blend;
				if (blendVal && funkin.play.BlendMode) funkin.play.BlendMode.apply(img, blendVal);

				if (funkin.play.data.camera && typeof funkin.play.data.camera.addObjToGame === 'function') {
					funkin.play.data.camera.addObjToGame(img);
				}
			}
		});
	}
}
funkin.play.visuals.stage.CreateImages = CreateImages;