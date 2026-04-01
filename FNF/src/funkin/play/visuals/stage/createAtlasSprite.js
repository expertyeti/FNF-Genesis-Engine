/**
 * Clase para la creacion e inyeccion de sprites de tipo atlas o animaciones de TexturePacker en el Stage.
 */
class CreateAtlasSprite {
	/**
	 * @param {Phaser.Scene} scene
	 * @param {string} stageName
	 */
	static execute(scene, stageName) {
		const data = funkin.play.stageManager.get();
		if (!data || !data.stage) return;

		const pathName = data.pathName || stageName;

		data.stage.forEach((item) => {
			if (!item.type) return;

			const tipo = item.type.toLowerCase();

			if (
				tipo === "atlas" ||
				tipo === "animate" ||
				tipo === "spritesheetatlas" ||
				tipo === "animateatlas"
			) {
				const x = item.position ? item.position[0] : item.x || 0;
				const y = item.position ? item.position[1] : item.y || 0;

				const cleanPath = item.namePath
					? item.namePath.endsWith("/")
						? item.namePath.slice(0, -1)
						: item.namePath
					: "";

				const imageKey =
					item.image ||
					item.name ||
					(cleanPath ? `stage_${pathName}_${cleanPath}` : `stage_${pathName}`);

				if (scene.textures.exists(imageKey)) {
					if (item.antialiasing === false) {
						scene.textures
							.get(imageKey)
							.setFilter(Phaser.Textures.FilterMode.NEAREST);
					}
					if (item.chromaKey && funkin.play && funkin.play.uiSkins) {
						funkin.play.uiSkins.applyChromaKey(scene, imageKey, item.chromaKey);
					}
				}

				const settings = {
					Antialiasing: item.antialiasing !== false,
					FrameRate: 24,
				};

				let atlasSprite = null;

				if (
					funkin.animation &&
					funkin.animation.atlas &&
					funkin.animation.atlas.AtlasAPI
				) {
					atlasSprite = funkin.animation.atlas.AtlasAPI.create(
						scene,
						x,
						y,
						imageKey,
						settings,
					);
				} else {
					return;
				}

				if (item.origin) {
					atlasSprite.x -= item.origin[0];
					atlasSprite.y -= item.origin[1];
				}

				if (item.scale !== undefined) atlasSprite.setScale(item.scale);
				if (item.rotate !== undefined) atlasSprite.setAngle(item.rotate);
				else if (item.angle !== undefined) atlasSprite.setAngle(item.angle);
				else if (item.rotation !== undefined)
					atlasSprite.setRotation(item.rotation);

				if (item.flipX !== undefined) atlasSprite.scaleX *= item.flipX ? -1 : 1;
				if (item.flipY !== undefined) atlasSprite.scaleY *= item.flipY ? -1 : 1;
				if (item.flip_x !== undefined)
					atlasSprite.scaleX *= item.flip_x ? -1 : 1;
				if (item.flip_y !== undefined)
					atlasSprite.scaleY *= item.flip_y ? -1 : 1;

				if (item.scrollFactor !== undefined) {
					if (Array.isArray(item.scrollFactor)) {
						atlasSprite.setScrollFactor(
							item.scrollFactor[0],
							item.scrollFactor[1],
						);
					} else {
						atlasSprite.setScrollFactor(item.scrollFactor);
					}
				}

				if (item.alpha !== undefined) atlasSprite.setAlpha(item.alpha);
				else if (item.opacity !== undefined) atlasSprite.setAlpha(item.opacity);
				if (item.layer !== undefined) atlasSprite.setDepth(item.layer);
				if (item.visible !== undefined) atlasSprite.setVisible(item.visible);

				// Solucion a los modos de fusion
				const blendVal = item.blendMode || item.blend;
				if (blendVal && funkin.play.BlendMode) {
					funkin.play.BlendMode.apply(atlasSprite, blendVal);
				}

				if (item.animation) {
					let animConfig = item.animation;
					let playMode = String(animConfig.play_mode || "loop")
						.toLowerCase()
						.trim();
					let isLoop = playMode === "loop"; 

					if (animConfig.play_list) {
						let playListArray = Array.isArray(animConfig.play_list)
							? animConfig.play_list
							: Object.keys(animConfig.play_list).map((key) => {
									return { name: key, ...animConfig.play_list[key] };
							  });

						for (let dataAnim of playListArray) {
							let animName = dataAnim.name || dataAnim.anim;
							let prefix = dataAnim.prefix || animName;
							let fps = dataAnim.frameRate || animConfig.frameRate || 24;
							let flipX = dataAnim.flipX !== undefined ? dataAnim.flipX : false;
							let flipY = dataAnim.flipY !== undefined ? dataAnim.flipY : false;
							let indices = dataAnim.indices || dataAnim.frameIndices || null;
							let looped =
								dataAnim.looped !== undefined ? dataAnim.looped : isLoop;

							atlasSprite.addTextureAtlasAnimation({
								name: animName,
								prefix: prefix,
								frameRate: fps,
								looped: looped,
								flipX: flipX,
								flipY: flipY,
								frameIndices: indices,
							});
						}
					}

					if (funkin.play.playListSprites) {
						funkin.play.playListSprites.add(
							atlasSprite,
							animConfig,
							imageKey,
							true,
						);
					} else {
						let animsList =
							atlasSprite.animations instanceof Map
								? Array.from(atlasSprite.animations.values())
								: atlasSprite.animations || [];
						if (animsList.length > 0) {
							let idleAnim = animsList.find((a) => a.name === "idle");
							let playDefault = idleAnim ? idleAnim.name : animsList[0].name;
							atlasSprite.play(playDefault, !isLoop);
						} else {
							atlasSprite.play("default", !isLoop);
						}
					}
				} else {
					atlasSprite.play("default", false);
				}
			}
		});
	}
}

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.stage = funkin.play.stage || {};
funkin.play.stage.CreateAtlasSprite = CreateAtlasSprite;