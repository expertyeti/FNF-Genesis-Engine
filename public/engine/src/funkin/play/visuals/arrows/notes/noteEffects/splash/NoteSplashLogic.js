/**
 * @file src/funkin/play/visuals/arrows/notes/noteEffects/splash/NoteSplashLogic.js
 */
window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.arrows = funkin.play.visuals.arrows || {};
funkin.play.visuals.arrows.notes = funkin.play.visuals.arrows.notes || {};

class NoteSplashLogic {
	constructor(manager) {
		this.manager = manager;
		this.scene = manager.scene;
		this.activeSplashes = []; 
	}

	setupEvents() {
		if (funkin.playNotes) {
			funkin.playNotes.event("noteHit", (hitData) => {
				if (!hitData || !hitData.judgment) return;
				
				const getStoredOption = (key) => localStorage.getItem(`fnf_${key}`) === "true";
				const is2P = getStoredOption("twoPlayerLocal");
				if (!hitData.isPlayer && !is2P) return;
				
				const judg = hitData.judgment.toLowerCase();
				if (hitData.pressed && (judg === "sick" || judg === "perfect")) {
					this.spawnSplash(hitData);
				}
			});
		}
	}

	update(time, delta) {
		for (let i = this.activeSplashes.length - 1; i >= 0; i--) {
			const data = this.activeSplashes[i];
			if (!data.sprite || !data.sprite.active) {
				this.activeSplashes.splice(i, 1);
				continue;
			}

			const strum = data.strum;
			if (strum && strum.active) {
				const currentScaleX = strum.staticScaleX !== undefined ? strum.staticScaleX : strum.scaleX;
				const relativeScale = currentScaleX / (strum.baseScale || 1);
				const finalScale = data.baseSplashScale * relativeScale;

				data.sprite.setScale(finalScale);

				const originX = strum.originX !== undefined ? strum.originX : 0.5;
				const originY = strum.originY !== undefined ? strum.originY : 0.5;
				const staticW = strum._staticFrameWidth || strum.width || 160;
				const staticH = strum._staticFrameHeight || strum.height || 160;

				let stableX = strum.x;
				let stableY = strum.y;
				if (strum.baseX !== undefined && strum.baseY !== undefined) {
					const staticOff = (strum.animsOffsets && strum.animsOffsets['static']) ? strum.animsOffsets['static'] : [0, 0];
					stableX = strum.baseX + staticOff[0];
					stableY = strum.baseY + staticOff[1];
				}

				const strumCenterX = stableX + (staticW * currentScaleX * (0.5 - originX));
				const strumCenterY = stableY + (staticH * currentScaleX * (0.5 - originY));

				const offsetX = data.baseOffsetX * relativeScale;
				const offsetY = data.baseOffsetY * relativeScale;

				data.sprite.x = strumCenterX + offsetX;
				data.sprite.y = strumCenterY + offsetY;
			}
		}
	}

	spawnSplash(hitData) {
		if (!this.manager.skin.skinData) return;
		
		if (hitData.note && typeof funkin.conductor !== "undefined") {
			const timeDiff = Math.abs(funkin.conductor.songPosition - hitData.note.noteTime);
			if (timeDiff > 250) return; 
		}

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
		
		let strum = null;
		let strumAlpha = 1.0;

		const baseSplashScale = this.manager.skin.skinData.scale !== undefined ? this.manager.skin.skinData.scale : 0.7;
		let finalScale = baseSplashScale;
		let strumX = -5000;
		let strumY = -5000;
		
		const baseOffsetX = this.manager.skin.skinData.Offset ? this.manager.skin.skinData.Offset[0] || 0 : 0;
		const baseOffsetY = this.manager.skin.skinData.Offset ? this.manager.skin.skinData.Offset[1] || 0 : 0;

		if (targetStrums && targetStrums[dirIndex]) {
			strum = targetStrums[dirIndex];
			strumAlpha = strum.alpha;
			
			const currentScaleX = strum.staticScaleX !== undefined ? strum.staticScaleX : strum.scaleX;
			const relativeScale = currentScaleX / (strum.baseScale || 1);
			finalScale = baseSplashScale * relativeScale;
			
			const originX = strum.originX !== undefined ? strum.originX : 0.5;
			const originY = strum.originY !== undefined ? strum.originY : 0.5;
			const staticW = strum._staticFrameWidth || strum.width || 160;
			const staticH = strum._staticFrameHeight || strum.height || 160;

			let stableX = strum.x;
			let stableY = strum.y;
			if (strum.baseX !== undefined && strum.baseY !== undefined) {
				const staticOff = (strum.animsOffsets && strum.animsOffsets['static']) ? strum.animsOffsets['static'] : [0, 0];
				stableX = strum.baseX + staticOff[0];
				stableY = strum.baseY + staticOff[1];
			}

			const strumCenterX = stableX + (staticW * currentScaleX * (0.5 - originX));
			const strumCenterY = stableY + (staticH * currentScaleX * (0.5 - originY));

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

		if (funkin.play.data.camera && funkin.play.data.camera.addObjToUI) funkin.play.data.camera.addObjToUI(splash);
		else splash.setScrollFactor(0);

		const splashData = {
			sprite: splash,
			strum: strum,
			baseSplashScale: baseSplashScale,
			baseOffsetX: baseOffsetX,
			baseOffsetY: baseOffsetY
		};
		this.activeSplashes.push(splashData);

		const prefixes = this.manager.skin.skinData.animations[dirName];
		if (prefixes && prefixes.length > 0) {
			const randIndex = Phaser.Math.Between(0, prefixes.length - 1);
			const animName = `${assetKey}_splash_${dirName}_${randIndex}`;

			if (this.scene.anims.exists(animName)) {
				splash.play(animName, true); 
				splash.once("animationcomplete", () => this.removeSplash(splashData));
			} else {
				this.scene.tweens.add({ targets: splash, alpha: 0, duration: 250, onComplete: () => this.removeSplash(splashData) });
			}
		} else {
			this.removeSplash(splashData);
		}
	}

	removeSplash(splashData) {
		const idx = this.activeSplashes.indexOf(splashData);
		if (idx !== -1) this.activeSplashes.splice(idx, 1);
		if (splashData.sprite) splashData.sprite.destroy();
	}
}
funkin.play.visuals.arrows.notes.NoteSplashLogic = NoteSplashLogic;