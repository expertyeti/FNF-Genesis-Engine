class HoldCoverSkin {
	constructor(manager) {
		this.manager = manager;
		this.scene = manager.scene;
		this.skinData = null;
	}

	reloadSkin(triggerDrops = false) {
		if (!funkin.play || !funkin.play.uiSkins) return;
		this.skinData = funkin.play.uiSkins.get("gameplay.holdCovers") || funkin.play.uiSkins.get("holdCovers");
		this.setupAnimations();

		if (triggerDrops) {
			const reloadCoversForSide = (coversArray, isPlayer) => {
				for (let i = 0; i < coversArray.length; i++) {
					const cover = coversArray[i];
					if (cover && cover.active) {
						if (cover.anims) cover.stop();
						const sustainId = cover.sustainId;
						this.manager.logic.onSustainDrop({ lane: i, isPlayer: isPlayer, id: sustainId });
						this.manager.logic.onSustainStart({ lane: i, isPlayer: isPlayer, id: sustainId });
					}
				}
			};
			reloadCoversForSide(this.manager.activeCovers.player, true);
			reloadCoversForSide(this.manager.activeCovers.opponent, false);
		}
	}

	setupAnimations() {
		if (!this.skinData || !this.skinData.directions) return;

		this.manager.directions.forEach((dir) => {
			const dirData = this.skinData.directions[dir];
			if (!dirData || !dirData.assetPath) return;

			const assetKey = funkin.play.uiSkins.getAssetKey(dirData.assetPath);
			if (!this.scene.textures.exists(assetKey)) return;

			if (funkin.utils.animations.sparrow.SparrowParser) {
				const xmlText = this.scene.cache.text.get(`${assetKey}_rawXML`);
				if (xmlText) {
					funkin.utils.animations.sparrow.SparrowParser.fixPhaserSparrow(this.scene, assetKey, xmlText);
					const tex = this.scene.textures.get(assetKey);
					if (tex && tex.source) tex.source.forEach((s) => s.update());
				}
			}

			if (funkin.play.uiSkins) {
				const chroma = dirData.chromaKey || this.skinData.chromaKey;
				if (chroma) {
					funkin.play.uiSkins.applyChromaKey(this.scene, assetKey, chroma);
				}
			}

			const frameNames = this.scene.textures.get(assetKey).getFrameNames();
			const animsConfig = dirData.animations;

			["start", "hold", "end"].forEach((type) => {
				const prefix = animsConfig[type];
				if (!prefix) return;

				const animName = `${assetKey}_cover_${dir}_${type}`;

				if (!this.scene.anims.exists(animName)) {
					let matchingFrames = frameNames.filter((name) => name.startsWith(prefix));

					if (matchingFrames.length === 0) {
						const cleanPrefix = prefix.trim().toLowerCase().replace(/\s+/g, "");
						matchingFrames = frameNames.filter((name) => {
							const cleanName = name.trim().toLowerCase().replace(/\s+/g, "");
							return cleanName.startsWith(cleanPrefix);
						});
					}

					matchingFrames.sort();

					if (matchingFrames.length > 0) {
						this.scene.anims.create({
							key: animName,
							frames: matchingFrames.map((frame) => ({ key: assetKey, frame: frame })),
							frameRate: 24,
							repeat: type === "hold" ? -1 : 0,
						});
					}
				}
			});
		});
	}

	getAssetKeyAndAnims(dirName) {
		if (!this.skinData || !this.skinData.directions || !this.skinData.directions[dirName]) return null;
		const dirData = this.skinData.directions[dirName];
		return {
			assetKey: funkin.play.uiSkins.getAssetKey(dirData.assetPath),
			animsConfig: dirData.animations,
			dirData: dirData,
		};
	}
}
funkin.play.visuals.arrows.notes.HoldCoverSkin = HoldCoverSkin;