/**
 * Crea spritesheets animados en el escenario basándose en la configuración del JSON.
 */
class CreateSprites {
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
			if (item.type === 'spritesheet' && item.namePath) {
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

				if (item.animation && item.animation.play_list) {
					const animData = item.animation;
					const frameRate = animData.frameRate || 24;
					const playMode = (animData.play_mode || 'none').toLowerCase();

					const texture = scene.textures.get(key);
					let allFrames = [];

					if (texture) {
						for (let f in texture.frames) {
							if (f !== '__BASE') allFrames.push(f);
						}
					}

					Object.keys(animData.play_list).forEach((animName) => {
						const playDef = animData.play_list[animName];
						const prefix = playDef.prefix;
						const indices = playDef.indices;

						if (prefix) {
							let matchedFrames = allFrames.filter((f) => f.toLowerCase().startsWith(prefix.toLowerCase()));
							matchedFrames.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

							let finalFrames = [];

							if (indices && Array.isArray(indices) && indices.length > 0) {
								indices.forEach((idx) => {
									const i = parseInt(idx, 10);
									if (matchedFrames[i]) finalFrames.push({ key: key, frame: matchedFrames[i] });
								});
							} else {
								finalFrames = matchedFrames.map((f) => ({ key: key, frame: f }));
							}

							const animKey = `${key}_${animName}`;
							if (!scene.anims.exists(animKey) && finalFrames.length > 0) {
								scene.anims.create({
									key: animKey,
									frames: finalFrames,
									frameRate: frameRate,
									repeat: playMode === 'loop' ? -1 : 0
								});
							}
						}
					});

					if (funkin.play.playListSprites) {
						funkin.play.playListSprites.add(spr, animData, key);
					}
				}
			}
		});
	}
}

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.CreateSprites = CreateSprites;