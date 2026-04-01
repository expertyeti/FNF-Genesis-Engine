/**
 * Observador de eventos y ejecutor para invocar los impactos al tocar notas con precision.
 */
class NoteSplashLogic {
	constructor(manager) {
		this.manager = manager;
		this.scene = manager.scene;
	}

	setupEvents() {
		if (funkin.playNotes) {
			funkin.playNotes.event("noteHit", (hitData) => {
				if (!hitData || !hitData.judgment) return;
				
				const judg = hitData.judgment.toLowerCase();
				if (hitData.pressed && (judg === "sick" || judg === "perfect")) {
					this.spawnSplash(hitData);
				}
			});
		}
	}

	spawnSplash(hitData) {
		if (!this.manager.skin.skinData) return;

		const assetKey = funkin.play.uiSkins.getAssetKey(this.manager.skin.skinData.assetPath);
		if (!this.scene.textures.exists(assetKey)) return;

		let dirIndex = hitData.direction;
		let dirName = hitData.direction;

		if (typeof hitData.direction === "number") {
			dirName = this.manager.directions[hitData.direction];
		} else if (typeof hitData.direction === "string") {
			dirIndex = this.manager.directions.indexOf(hitData.direction.toLowerCase());
			dirName = hitData.direction.toLowerCase();
		}

		if (dirIndex < 0 || dirIndex >= this.manager.keyCount) return;

		const isPlayer = hitData.isPlayer !== undefined ? hitData.isPlayer : true;
		const targetStrums = isPlayer ? this.scene.strumlines?.playerStrums : this.scene.strumlines?.opponentStrums;
		
		let strumX = -5000;
		let strumY = -5000;
		let strumAlpha = 1.0;

		const baseSplashScale = this.manager.skin.skinData.scale !== undefined ? this.manager.skin.skinData.scale : 0.7;
		let finalScale = baseSplashScale;

		if (targetStrums && targetStrums[dirIndex]) {
			const strum = targetStrums[dirIndex];
			strumAlpha = strum.alpha;
			const relativeScale = strum.scaleX / (strum.baseScale || 1);
			finalScale = baseSplashScale * relativeScale;
			
			const originX = strum.originX !== undefined ? strum.originX : 0.5;
			const originY = strum.originY !== undefined ? strum.originY : 0.5;
			const strumCenterX = strum.baseX + (strum.displayWidth * (0.5 - originX));
			const strumCenterY = strum.baseY + (strum.displayHeight * (0.5 - originY));

			const baseOffsetX = this.manager.skin.skinData.Offset ? this.manager.skin.skinData.Offset[0] || 0 : 0;
			const baseOffsetY = this.manager.skin.skinData.Offset ? this.manager.skin.skinData.Offset[1] || 0 : 0;
			
			const offsetX = baseOffsetX * relativeScale;
			const offsetY = baseOffsetY * relativeScale;

			strumX = strumCenterX + offsetX;
			strumY = strumCenterY + offsetY;
		}

		const defaultFrame = this.scene.textures.get(assetKey).getFrameNames()[0];
		const splash = this.scene.add.sprite(strumX, strumY, assetKey, defaultFrame);
		
		splash.setOrigin(0.5, 0.5); 
		splash.setScale(finalScale);
		splash.setAlpha(strumAlpha * (this.manager.skin.skinData.alpha !== undefined ? this.manager.skin.skinData.alpha : 0.8));
		splash.setDepth(3500); 
		splash.setVisible(true);

		if (this.manager.skin.skinData.blendMode && funkin.play.uiSkins) {
			funkin.play.uiSkins.applyBlendMode(splash, this.manager.skin.skinData.blendMode);
		}

		if (funkin.playCamera && funkin.playCamera.addObjToUI) funkin.playCamera.addObjToUI(splash);
		else splash.setScrollFactor(0);

		const prefixes = this.manager.skin.skinData.animations[dirName];
		if (prefixes && prefixes.length > 0) {
			const randIndex = Phaser.Math.Between(0, prefixes.length - 1);
			const animName = `${assetKey}_splash_${dirName}_${randIndex}`;

			if (this.scene.anims.exists(animName)) {
				splash.play(animName, true); 
				splash.once("animationcomplete", () => splash.destroy());
			} else {
				this.scene.tweens.add({ targets: splash, alpha: 0, duration: 250, onComplete: () => splash.destroy() });
			}
		} else {
			splash.destroy();
		}
	}
}

if (typeof window !== "undefined") funkin.NoteSplashLogic = NoteSplashLogic;