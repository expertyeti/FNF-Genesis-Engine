/**
 * @file NoteSplashRenderer.js
 * Construye y aplica las texturas a los efectos de Note Splash.
 */

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.arrows = funkin.play.visuals.arrows || {};
funkin.play.visuals.arrows.notes = funkin.play.visuals.arrows.notes || {};

class NoteSplashSkin {
	constructor(manager) {
		this.manager = manager;
		this.scene = manager.scene;
		this.skinData = null;
	}

	reloadSkin() {
		if (!funkin.play || !funkin.play.uiSkins) return;
		this.skinData = funkin.play.uiSkins.get("gameplay.noteSplashes") || funkin.play.uiSkins.get("noteSplashes");
		this.setupAnimations();
	}

	setupAnimations() {
		if (!this.skinData || !this.skinData.assetPath) return;
		
		const assetKey = funkin.play.uiSkins.getAssetKey(this.skinData.assetPath);
		if (!this.scene.textures.exists(assetKey)) return;

		if (funkin.utils.animations.sparrow.SparrowParser) {
			const xmlText = this.scene.cache.text.get(`${assetKey}_rawXML`);
			if (xmlText) {
				funkin.utils.animations.sparrow.SparrowParser.fixPhaserSparrow(this.scene, assetKey, xmlText);
				const tex = this.scene.textures.get(assetKey);
				if (tex && tex.source) tex.source.forEach((s) => s.update());
			}
		}

		if (this.skinData.chromaKey && funkin.play.uiSkins) {
			funkin.play.uiSkins.applyChromaKey(this.scene, assetKey, this.skinData.chromaKey);
		}

		const frameNames = this.scene.textures.get(assetKey).getFrameNames();
		
		this.manager.directions.forEach((dir) => {
			const prefixes = this.skinData.animations[dir];
			if (!prefixes) return;

			prefixes.forEach((prefix, index) => {
				const animName = `${assetKey}_splash_${dir}_${index}`;
				
				if (!this.scene.anims.exists(animName)) {
					const cleanPrefix = prefix.trim().toLowerCase().replace(/\s+/g, "");
					
					const matchingFrames = frameNames.filter((name) => {
						const cleanName = name.trim().toLowerCase().replace(/\s+/g, "");
						return cleanName.startsWith(cleanPrefix) || cleanName.includes(cleanPrefix);
					});
					
					matchingFrames.sort(); 

					if (matchingFrames.length > 0) {
						this.scene.anims.create({
							key: animName,
							frames: matchingFrames.map((frame) => ({ key: assetKey, frame: frame })),
							frameRate: 24,
							repeat: 0 
						});
					}
				}
			});
		});
	}
}
funkin.play.visuals.arrows.notes.NoteSplashSkin = NoteSplashSkin;