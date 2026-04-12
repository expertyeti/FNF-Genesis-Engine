class SustainSkin {
	constructor(manager) {
		this.manager = manager;
		this.scene = manager.scene;
	}

	getFrameName(assetKey, prefix) {
		const frameNames = this.scene.textures.get(assetKey).getFrameNames();
		const matching = frameNames.filter((name) => name && name.startsWith(prefix));
		matching.sort();
		return matching.length > 0 ? matching[0] : frameNames[0];
	}

	initSustains() {
		if (!funkin.play || !funkin.play.uiSkins || !funkin.play.session || !funkin.play.chart) return;

		const skinData = funkin.play.uiSkins.get("gameplay.sustains");
		const chartData = funkin.play.chart.get("notes");

		if (!skinData || !chartData || !Array.isArray(chartData) || chartData.length === 0) return;

		const assetKey = funkin.play.uiSkins.getAssetKey(skinData.assetPath);
		if (!this.scene.textures.exists(assetKey)) return;

		this.scene.textures.get(assetKey).setFilter(Phaser.Textures.FilterMode.LINEAR);

		if (funkin.utils.animations.sparrow.SparrowParser) {
			const xmlText = this.scene.cache.text.get(`${assetKey}_rawXML`);
			if (xmlText) {
				funkin.utils.animations.sparrow.SparrowParser.fixPhaserSparrow(this.scene, assetKey, xmlText);
				const tex = this.scene.textures.get(assetKey);
				if (tex && tex.source) tex.source.forEach((s) => s.update());
			}
		}

		if (skinData.chromaKey && funkin.play.uiSkins) {
			funkin.play.uiSkins.applyChromaKey(this.scene, assetKey, skinData.chromaKey);
		}

		this.spawnSustains(chartData, assetKey, skinData);
	}

	spawnSustains(chartNotesArray, assetKey, skinData) {
		const scale = skinData.scale !== undefined ? skinData.scale : 0.7;
		const alpha = this.manager.globalSustainAlpha;
		const animations = skinData.animations;
		const skinOffset = skinData.Offset || [0, 0];
		const skinOffsetHit = skinData.OffsetHit || [0, 0];
		const cachedFrames = {};

		if (animations) {
			for (const dir in animations) {
				cachedFrames[dir] = {
					body: this.getFrameName(assetKey, animations[dir].body),
					end: this.getFrameName(assetKey, animations[dir].end),
				};
			}
		}

		chartNotesArray.forEach((noteData) => {
			if (!noteData.l || noteData.l <= 0) return;

			const time = noteData.t;
			const dir = noteData.d;
			const p = noteData.p;
			const length = noteData.l;

			const isPlayer = funkin.play.visuals.arrows.notes.NoteDirection.isPlayerNote(p);
			const lane = funkin.play.visuals.arrows.notes.NoteDirection.getBaseLane(dir);
			const dirName = funkin.play.visuals.arrows.notes.NoteDirection.getDirectionName(lane);

			const frameData = cachedFrames[dirName] ||
				cachedFrames["left"] ||
				cachedFrames["center"] || { body: "", end: "" };
			const bodyFrame = frameData.body;
			const endFrame = frameData.end;

			const maskIndex = (isPlayer ? this.manager.keyCount : 0) + lane;
			const targetMask = this.manager.sustainMasksList[maskIndex];

			let numPieces = Math.ceil(length / this.manager.sustainChunkMs);
			if (numPieces < 1) numPieces = 1;
			let actualChunkMs = length / numPieces;

			let bodyParts = [];
			for (let i = 0; i < numPieces; i++) {
				let piece = this.scene.add.sprite(-5000, -5000, assetKey, bodyFrame);
				piece.setScale(scale);
				piece.setAlpha(alpha);
				piece.setOrigin(0, 0);
				piece.setDepth(2400);
				piece.setMask(targetMask);

				piece.chunkIndex = i;
				piece.pieceTime = time + i * actualChunkMs;
				piece.chunkMs = actualChunkMs;

				if (skinData.blendMode && funkin.play.uiSkins)
					funkin.play.uiSkins.applyBlendMode(piece, skinData.blendMode);

				if (funkin.play.data.camera && funkin.play.data.camera.addObjToUI) funkin.play.data.camera.addObjToUI(piece);
				else piece.setScrollFactor(0);

				bodyParts.push(piece);
			}

			const end = this.scene.add.sprite(-5000, -5000, assetKey, endFrame);
			end.setScale(scale);
			end.setAlpha(alpha);
			end.setOrigin(0, 0);
			end.setDepth(2400);
			end.setMask(targetMask);

			if (skinData.blendMode && funkin.play.uiSkins) funkin.play.uiSkins.applyBlendMode(end, skinData.blendMode);

			if (funkin.play.data.camera && funkin.play.data.camera.addObjToUI) funkin.play.data.camera.addObjToUI(end);
			else end.setScrollFactor(0);

			this.manager.sustains.push({
				id: `sust_${time}_${lane}_${isPlayer}_${Math.floor(Math.random() * 99999)}`,
				time: time,
				length: length,
				lane: lane,
				isPlayer: isPlayer,
				bodyParts: bodyParts,
				end: end,
				baseScale: scale,
				baseAlpha: alpha,
				isBeingHit: false,
				wasBeingHit: false,
				active: true,
				skinOffset: skinOffset,
				skinOffsetHit: skinOffsetHit,
				hasBeenHit: false,
				parentMissed: false,
				consumedTime: 0,
				strumReset: false,
				earlyReleaseCompleted: false,
				coverEnded: false,
				missAnimPlayed: false,
			});
		});
	}

	reloadSkin() {
		if (!funkin.play || !funkin.play.uiSkins || !funkin.play.session) return;
		const skinData = funkin.play.uiSkins.get("gameplay.sustains");
		if (!skinData) return;

		const assetKey = funkin.play.uiSkins.getAssetKey(skinData.assetPath);
		if (!this.scene.textures.exists(assetKey)) return;

		this.scene.textures.get(assetKey).setFilter(Phaser.Textures.FilterMode.LINEAR);

		if (funkin.utils.animations.sparrow.SparrowParser) {
			const xmlText = this.scene.cache.text.get(`${assetKey}_rawXML`);
			if (xmlText) {
				funkin.utils.animations.sparrow.SparrowParser.fixPhaserSparrow(this.scene, assetKey, xmlText);
				const tex = this.scene.textures.get(assetKey);
				if (tex && tex.source) tex.source.forEach((s) => s.update());
			}
		}

		if (skinData.chromaKey && funkin.play.uiSkins) {
			funkin.play.uiSkins.applyChromaKey(this.scene, assetKey, skinData.chromaKey);
		}

		const scale = skinData.scale !== undefined ? skinData.scale : 0.7;
		const alpha = this.manager.globalSustainAlpha;
		const animations = skinData.animations;
		const skinOffset = skinData.Offset || [0, 0];
		const skinOffsetHit = skinData.OffsetHit || [0, 0];
		const cachedFrames = {};

		if (animations) {
			for (const dir in animations) {
				cachedFrames[dir] = {
					body: this.getFrameName(assetKey, animations[dir].body),
					end: this.getFrameName(assetKey, animations[dir].end),
				};
			}
		}

		this.manager.sustains.forEach((sustain) => {
			const dirName = funkin.play.visuals.arrows.notes.NoteDirection.getDirectionName(sustain.lane);
			const frameData = cachedFrames[dirName] ||
				cachedFrames["left"] ||
				cachedFrames["center"] || { body: "", end: "" };

			sustain.bodyParts.forEach((piece) => {
				if (piece.anims) piece.stop();
				piece.setTexture(assetKey, frameData.body);
				piece.setScale(scale);
				if (skinData.blendMode && funkin.play.uiSkins)
					funkin.play.uiSkins.applyBlendMode(piece, skinData.blendMode);
			});

			if (sustain.end.anims) sustain.end.stop();
			sustain.end.setTexture(assetKey, frameData.end);
			sustain.end.setScale(scale);
			if (skinData.blendMode && funkin.play.uiSkins)
				funkin.play.uiSkins.applyBlendMode(sustain.end, skinData.blendMode);

			sustain.baseScale = scale;
			sustain.baseAlpha = alpha;
			sustain.skinOffset = skinOffset;
			sustain.skinOffsetHit = skinOffsetHit;
		});
	}
}
funkin.play.visuals.arrows.notes.SustainSkin = SustainSkin;