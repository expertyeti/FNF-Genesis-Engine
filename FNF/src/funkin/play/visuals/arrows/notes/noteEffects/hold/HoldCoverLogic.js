/**
 * Crea e interconecta los sprites del cobertor con las notas retenidas.
 */
class HoldCoverLogic {
	constructor(manager) {
		this.manager = manager;
		this.scene = manager.scene;
	}

	setupEvents() {
		if (funkin.playSustains) {
			funkin.playSustains.event("sustainStart", (data) => this.onSustainStart(data));
			funkin.playSustains.event("sustainEnd", (data) => this.onSustainEnd(data));
			funkin.playSustains.event("sustainDrop", (data) => this.onSustainDrop(data));
		}
	}

	update() {
		if (!this.scene.strumlines || !this.manager.skin.skinData) return;

		const syncCoverToStrum = (cover, lane, isPlayer) => {
			if (!cover || !cover.active) return;
			const targetStrums = isPlayer ? this.scene.strumlines.playerStrums : this.scene.strumlines.opponentStrums;
			const strum = targetStrums[lane];
			
			if (strum) {
				const relativeScale = strum.scaleX / (strum.baseScale || 1);
				const baseCoverScale = this.manager.skin.skinData.scale !== undefined ? this.manager.skin.skinData.scale : 0.7;
				
				cover.setScale(baseCoverScale * relativeScale); 
				cover.setAlpha(strum.alpha);
				
				const originX = strum.originX !== undefined ? strum.originX : 0.5;
				const originY = strum.originY !== undefined ? strum.originY : 0.5;
				const strumCenterX = strum.baseX + (strum.displayWidth * (0.5 - originX));
				const strumCenterY = strum.baseY + (strum.displayHeight * (0.5 - originY));

				const baseOffsetX = this.manager.skin.skinData.Offset ? this.manager.skin.skinData.Offset[0] || 0 : 0;
				const baseOffsetY = this.manager.skin.skinData.Offset ? this.manager.skin.skinData.Offset[1] || 0 : 0;
				
				const offsetX = baseOffsetX * relativeScale;
				const offsetY = baseOffsetY * relativeScale;
				
				const coverOriginX = cover.originX !== undefined ? cover.originX : 0.5;
				const coverOriginY = cover.originY !== undefined ? cover.originY : 0.5;

				cover.x = strumCenterX - (cover.displayWidth * (0.5 - coverOriginX)) + offsetX;
				cover.y = strumCenterY - (cover.displayHeight * (0.5 - coverOriginY)) + offsetY;
			}
		};

		this.manager.activeCovers.player.forEach((c, i) => syncCoverToStrum(c, i, true));
		this.manager.activeCovers.opponent.forEach((c, i) => syncCoverToStrum(c, i, false));
	}

	onSustainStart(data) {
		const { lane, isPlayer, id } = data;
		const dirName = this.manager.directions[lane];
		const info = this.manager.skin.getAssetKeyAndAnims(dirName);
		
		if (!info || !this.scene.textures.exists(info.assetKey)) return;

		const targetArray = isPlayer ? this.manager.activeCovers.player : this.manager.activeCovers.opponent;

		if (targetArray[lane]) {
			targetArray[lane].destroy();
			targetArray[lane] = null;
		}

		const availableFrames = this.scene.textures.get(info.assetKey).getFrameNames();
		const defaultFrame = availableFrames.length > 1 ? availableFrames[1] : availableFrames[0];
		const targetStrums = isPlayer ? this.scene.strumlines?.playerStrums : this.scene.strumlines?.opponentStrums;

		const baseCoverScale = this.manager.skin.skinData.scale !== undefined ? this.manager.skin.skinData.scale : 0.7;
		let finalScale = baseCoverScale;

		let startAlpha = 1.0;
		let strumCenterX = -5000;
		let strumCenterY = -5000;
		let offsetX = 0;
		let offsetY = 0;

		if (targetStrums && targetStrums[lane]) {
			const strum = targetStrums[lane];
			startAlpha = strum.alpha;
			const relativeScale = strum.scaleX / (strum.baseScale || 1);
			finalScale = baseCoverScale * relativeScale;

			const originX = strum.originX !== undefined ? strum.originX : 0.5;
			const originY = strum.originY !== undefined ? strum.originY : 0.5;
			strumCenterX = strum.baseX + (strum.displayWidth * (0.5 - originX));
			strumCenterY = strum.baseY + (strum.displayHeight * (0.5 - originY));

			const baseOffsetX = this.manager.skin.skinData.Offset ? this.manager.skin.skinData.Offset[0] || 0 : 0;
			const baseOffsetY = this.manager.skin.skinData.Offset ? this.manager.skin.skinData.Offset[1] || 0 : 0;
			
			offsetX = baseOffsetX * relativeScale;
			offsetY = baseOffsetY * relativeScale;
		}

		const cover = this.scene.add.sprite(-5000, -5000, info.assetKey, defaultFrame);

		cover.setOrigin(0.5, 0.5); 
		cover.setScale(finalScale); 
		cover.setAlpha(startAlpha);
		cover.setDepth(3400);
		cover.setVisible(true);

		const coverOriginX = cover.originX !== undefined ? cover.originX : 0.5;
		const coverOriginY = cover.originY !== undefined ? cover.originY : 0.5;

		cover.x = strumCenterX - (cover.displayWidth * (0.5 - coverOriginX)) + offsetX;
		cover.y = strumCenterY - (cover.displayHeight * (0.5 - coverOriginY)) + offsetY;

		const blend = info.dirData.blendMode || this.manager.skin.skinData.blendMode;
		if (blend && funkin.play.uiSkins) {
			funkin.play.uiSkins.applyBlendMode(cover, blend);
		}

		cover.sustainId = id;
		targetArray[lane] = cover;

		if (funkin.playCamera && funkin.playCamera.addObjToUI) funkin.playCamera.addObjToUI(cover);
		else cover.setScrollFactor(0);

		const startAnim = `${info.assetKey}_cover_${dirName}_start`;
		const holdAnim = `${info.assetKey}_cover_${dirName}_hold`;

		if (this.scene.anims.exists(startAnim)) {
			cover.play(startAnim, true);
			cover.on("animationcomplete", (anim) => {
				if (!cover || !cover.scene || !cover.active) return;
				if (anim.key === startAnim && targetArray[lane] === cover && this.scene.anims.exists(holdAnim)) {
					cover.play(holdAnim, true);
				}
			});
		} else if (this.scene.anims.exists(holdAnim)) {
			cover.play(holdAnim, true);
		}
	}

	onSustainDrop(data) {
		const { lane, isPlayer, id } = data;
		const targetArray = isPlayer ? this.manager.activeCovers.player : this.manager.activeCovers.opponent;
		const cover = targetArray[lane];

		if (cover && cover.sustainId === id) {
			if (cover.anims) cover.stop(); 
			cover.setVisible(false);
			cover.destroy();
			targetArray[lane] = null;
		}
	}

	onSustainEnd(data) {
		const { lane, isPlayer, id } = data;
		const dirName = this.manager.directions[lane];
		const info = this.manager.skin.getAssetKeyAndAnims(dirName);
		if (!info) return;

		const targetArray = isPlayer ? this.manager.activeCovers.player : this.manager.activeCovers.opponent;
		const cover = targetArray[lane];

		if (cover && cover.active && cover.sustainId === id) {
			if (cover.anims) cover.stop(); 
			
			const endAnim = `${info.assetKey}_cover_${dirName}_end`;
			if (this.scene.anims.exists(endAnim)) {
				cover.play(endAnim, true);
				cover.once("animationcomplete", () => {
					if (cover && cover.active) cover.destroy();
					if (targetArray[lane] === cover) targetArray[lane] = null;
				});
			} else {
				cover.destroy();
				targetArray[lane] = null;
			}
		}
	}
}

if (typeof window !== "undefined") funkin.HoldCoverLogic = HoldCoverLogic;