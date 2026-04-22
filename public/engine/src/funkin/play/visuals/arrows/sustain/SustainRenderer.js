/**
 * @file SustainRenderer.js
 * Unificación del Renderizado Visual y Manejo de Skins para las notas largas.
 * ARREGLO: Las notas no golpeadas o soltadas ya no se recortan/consumen visualmente y usan el filtro adecuado.
 */

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.arrows = funkin.play.visuals.arrows || {};
funkin.play.visuals.arrows.notes = funkin.play.visuals.arrows.notes || {};

// ============================================================================
// SUSTAIN SKIN
// ============================================================================
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

		// --- APLICAR FILTRO ANTIALIASING (Quitando el LINEAR harcodeado) ---
		const isAntialiased = typeof funkin.play.uiSkins.getAntialiasing === 'function' ? funkin.play.uiSkins.getAntialiasing() : true;
		const filterMode = isAntialiased ? Phaser.Textures.FilterMode.LINEAR : Phaser.Textures.FilterMode.NEAREST;
		this.scene.textures.get(assetKey).setFilter(filterMode);
		// -------------------------------------------------------------------

		if (funkin.utils && funkin.utils.animations && funkin.utils.animations.sparrow) {
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

			const NoteDir = funkin.play.visuals.arrows.notes.NoteDirection || window.funkin.NoteDirection;
			const isPlayer = NoteDir ? NoteDir.isPlayerNote(p) : (p % 2 !== 0);
			const lane = NoteDir ? NoteDir.getBaseLane(dir) : dir % 4;
			const dirName = NoteDir ? NoteDir.getDirectionName(lane) : "left";

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

		// --- APLICAR FILTRO ANTIALIASING (Quitando el LINEAR harcodeado) ---
		const isAntialiased = typeof funkin.play.uiSkins.getAntialiasing === 'function' ? funkin.play.uiSkins.getAntialiasing() : true;
		const filterMode = isAntialiased ? Phaser.Textures.FilterMode.LINEAR : Phaser.Textures.FilterMode.NEAREST;
		this.scene.textures.get(assetKey).setFilter(filterMode);
		// -------------------------------------------------------------------

		if (funkin.utils && funkin.utils.animations && funkin.utils.animations.sparrow) {
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
			const NoteDir = funkin.play.visuals.arrows.notes.NoteDirection || window.funkin.NoteDirection;
			const dirName = NoteDir ? NoteDir.getDirectionName(sustain.lane) : "left";
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

// ============================================================================
// SUSTAIN RENDERER
// ============================================================================
class SustainRenderer {
  constructor(manager) {
    this.manager = manager;
    this.scene = manager.scene;
    
    this.getStoredOption = (key) => {
        if (typeof funkin !== 'undefined' && funkin.play && funkin.play.options && funkin.play.options[key] !== undefined) return funkin.play.options[key];
        return false;
    };
  }

  update(time, delta) {
    this.updateMasks();
    this.updateTransforms();
  }

  updateMasks() {
    let globalSkinOffsetY = 0;
    if (funkin.play && funkin.play.uiSkins) {
      const skinData = funkin.play.uiSkins.get("gameplay.sustains");
      if (skinData && skinData.Offset) globalSkinOffsetY = skinData.Offset[1] || 0;
    }

    const globalDownscroll = this.getStoredOption("downscroll") === true;

    for (let i = 0; i < this.manager.maskGraphicsList.length; i++) {
      this.manager.maskGraphicsList[i].clear();
      this.manager.maskGraphicsList[i].fillStyle(0xffffff, 1);
    }

    for (let lane = 0; lane < this.manager.keyCount; lane++) {
      let sOffsetOpp = 0, sOffsetXOpp = 0, oppHitAdjust = 0;
      let sOffsetP = 0, sOffsetXP = 0, pHitAdjust = 0;

      for (let i = 0; i < this.manager.sustains.length; i++) {
        let s = this.manager.sustains[i];
        if (s.active && s.lane === lane) {
          if (s.isPlayer) {
            sOffsetXP = s.skinOffset[0] || 0;
            sOffsetP = s.skinOffset[1] || 0;
            if (s.isBeingHit) pHitAdjust = s.skinOffsetHit[1] || 0;
          } else {
            sOffsetXOpp = s.skinOffset[0] || 0;
            sOffsetOpp = s.skinOffset[1] || 0;
            if (s.isBeingHit) oppHitAdjust = s.skinOffsetHit[1] || 0;
          }
        }
      }

      const applyMask = (strum, maskGraphic, laneOffset, isPlayer) => {
        let isDownscroll = globalDownscroll;
        const NoteLane = funkin.play.visuals.arrows.notes.RialNotes || funkin.play.visuals.arrows.strumelines.NoteLane;

        let bX = strum ? strum.x : NoteLane.getXPosition(lane, isPlayer, this.manager.strumlines);
        let bY = strum ? strum.y : NoteLane.getYPosition(lane, isPlayer, this.manager.strumlines);

        if (!isNaN(bX) && !isNaN(bY)) {
          let relativeScale = 1; 
          let strumCenterY = bY + 56;
          let strumCenterX = bX + 56;

          if (strum) {
            if (strum.downscroll !== undefined) isDownscroll = strum.downscroll;
            else if (strum.isDownscroll !== undefined) isDownscroll = strum.isDownscroll;

            const originX = strum.originX !== undefined ? strum.originX : 0.5;
            const originY = strum.originY !== undefined ? strum.originY : 0.5;
            
            const staticW = strum._staticFrameWidth || strum.width || 160;
            const staticH = strum._staticFrameHeight || strum.height || 160;
            const currentScaleX = strum.staticScaleX !== undefined ? strum.staticScaleX : strum.scaleX;
            relativeScale = currentScaleX / (strum.baseScale || 1);

            let stableX = strum.x;
            let stableY = strum.y;
            if (strum.baseX !== undefined && strum.baseY !== undefined) {
                const staticOff = (strum.animsOffsets && strum.animsOffsets['static']) ? strum.animsOffsets['static'] : [0, 0];
                stableX = strum.baseX + staticOff[0];
                stableY = strum.baseY + staticOff[1];
            }

            strumCenterX = stableX + (staticW * currentScaleX * (0.5 - originX));
            strumCenterY = stableY + (staticH * currentScaleX * (0.5 - originY));
          }

          let actualY = strumCenterY + this.manager.globalYOffset;
          let isDown = isDownscroll;
          let hitAdj = (isPlayer ? pHitAdjust : oppHitAdjust) * relativeScale;
          let offY = (isPlayer ? sOffsetP : sOffsetOpp) * relativeScale;
          let offX = (isPlayer ? sOffsetXP : sOffsetXOpp) * relativeScale;

          let maskY = actualY + globalSkinOffsetY + offY + hitAdj;
          let maskX = strumCenterX - (this.manager.maskWidth / 2) + offX;

          if (isDown) maskGraphic.fillRect(maskX, -2000, this.manager.maskWidth, maskY + 2000);
          else maskGraphic.fillRect(maskX, maskY, this.manager.maskWidth, 4000);
        }
      };

      let oppStrums = this.manager.strumlines && this.manager.strumlines.opponentStrums ? this.manager.strumlines.opponentStrums[lane] : null;
      let playerStrums = this.manager.strumlines && this.manager.strumlines.playerStrums ? this.manager.strumlines.playerStrums[lane] : null;

      applyMask(oppStrums, this.manager.maskGraphicsList[lane], lane, false);
      applyMask(playerStrums, this.manager.maskGraphicsList[this.manager.keyCount + lane], lane, true);
    }
  }

  updateTransforms() {
    const globalDownscroll = this.getStoredOption("downscroll") === true;
    const hideEnemy = this.getStoredOption("hideOpponentNotes") === true;
    const playAsOpponent = this.getStoredOption("playAsOpponent") === true;
    const isTwoPlayer = this.getStoredOption("twoPlayerLocal") === true;
    const songPos = funkin.conductor.songPosition;

    this.manager.sustains.forEach((sustain) => {
      if (!sustain.active) return;

      let strumScale = 1.0;
      let strumBaseScale = 1.0;
      let strumAlpha = 1.0;
      let strumCenterX = 0;
      let strumCenterY = 0;
      let isDownscroll = globalDownscroll;

      const targetStrums = sustain.isPlayer 
        ? (this.manager.strumlines ? this.manager.strumlines.playerStrums : null)
        : (this.manager.strumlines ? this.manager.strumlines.opponentStrums : null);

      if (targetStrums && targetStrums[sustain.lane]) {
        const strum = targetStrums[sustain.lane];

        if (strum.downscroll !== undefined) isDownscroll = strum.downscroll;
        else if (strum.isDownscroll !== undefined) isDownscroll = strum.isDownscroll;

        strumBaseScale = strum.baseScale || 1.0;
        strumScale = strum.staticScaleX !== undefined ? strum.staticScaleX : strum.scaleX;
        strumAlpha = strum.alpha;

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

        strumCenterX = stableX + (staticW * strumScale * (0.5 - originX));
        strumCenterY = stableY + (staticH * strumScale * (0.5 - originY));
      } else {
        const NoteLane = funkin.play.visuals.arrows.notes.RialNotes || funkin.play.visuals.arrows.strumelines.NoteLane;
        let fallbackX = NoteLane.getXPosition(sustain.lane, sustain.isPlayer, this.manager.strumlines);
        let fallbackY = NoteLane.getYPosition(sustain.lane, sustain.isPlayer, this.manager.strumlines);
        strumCenterX = fallbackX + 56;
        strumCenterY = fallbackY + 56;
      }

      const isMyNote = (playAsOpponent && !isTwoPlayer) ? !sustain.isPlayer : sustain.isPlayer;
      const relativeScale = strumScale / strumBaseScale;
      const finalScale = sustain.baseScale * relativeScale;

      // 🚨 ARREGLO VISUAL: Si la nota está fallada O el jugador la dejó pasar sin presionar,
      // se le quita la máscara y baja la opacidad para que no parezca que se consume.
      const isMissedOrDropped = sustain.parentMissed || (songPos > sustain.time && !sustain.isBeingHit);

      if (isMissedOrDropped) {
        sustain.bodyParts.forEach((p) => {
          p.setScale(finalScale);
          p.setAlpha(strumAlpha * sustain.baseAlpha * this.manager.missedAlphaMultiplier);
          if (p.mask) p.clearMask();
        });
        sustain.end.setScale(finalScale);
        sustain.end.setAlpha(strumAlpha * sustain.baseAlpha * this.manager.missedAlphaMultiplier);
        if (sustain.end.mask) sustain.end.clearMask();
      } else {
        const maskIndex = (sustain.isPlayer ? this.manager.keyCount : 0) + sustain.lane;
        const targetMask = this.manager.sustainMasksList[maskIndex];

        sustain.bodyParts.forEach((p) => {
          p.setScale(finalScale);
          p.setAlpha(strumAlpha * sustain.baseAlpha);
          if (!p.mask) p.setMask(targetMask);
        });
        sustain.end.setScale(finalScale);
        sustain.end.setAlpha(strumAlpha * sustain.baseAlpha);
        if (!sustain.end.mask) sustain.end.setMask(targetMask);
      }

      if (songPos > sustain.time + sustain.length + 5000 || songPos < sustain.time - 6000) {
        sustain.active = false;
        sustain.bodyParts.forEach((p) => (p.visible = false));
        sustain.end.visible = false;
        return;
      }

      const isHidden = hideEnemy && !isMyNote && !isTwoPlayer;
      const offsetX = (sustain.skinOffset[0] || 0) * relativeScale;
      const offsetY = (sustain.skinOffset[1] || 0) * relativeScale;
      let cropAdjustmentY = (sustain.hasBeenHit ? (sustain.skinOffsetHit[1] || 0) : 0) * relativeScale;
      const isFullyConsumed = sustain.hasBeenHit && (songPos > sustain.time + sustain.length || sustain.earlyReleaseCompleted);

      if (!isNaN(strumCenterX) && !isNaN(strumCenterY)) {
        const activeOverlap = sustain.baseAlpha < 1.0 ? 0 : this.manager.sustainOverlap;

        sustain.bodyParts.forEach((piece) => {
          if (sustain.consumedTime > 0 && sustain.isBeingHit) {
            let pieceEndTime = piece.pieceTime + piece.chunkMs;
            if (pieceEndTime <= sustain.time + sustain.consumedTime) {
              if (piece.visible) {
                piece.visible = false;
                if (sustain.isPlayer && typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(8);
              }
              return;
            }
          }

          const pieceOriginX = piece.originX !== undefined ? piece.originX : 0;
          const bodyWidth = piece.displayWidth || 35;
          const bodyX = strumCenterX - (bodyWidth * (0.5 - pieceOriginX)) + offsetX;

          let pieceTime = piece.pieceTime;
          let timeDiffStart = pieceTime - songPos;
          let distanceStart = timeDiffStart * 0.45 * this.manager.scrollSpeed;
          let pieceDistance = Math.abs(piece.chunkMs * 0.45 * this.manager.scrollSpeed);

          let baseY = strumCenterY + (isDownscroll ? -distanceStart : distanceStart) + offsetY + cropAdjustmentY + this.manager.globalYOffset;
          let roundedY = Math.round(baseY);
          let roundedNextY = Math.round(baseY + pieceDistance);

          if (isHidden || roundedY > 3500 || roundedNextY < -2000 || isFullyConsumed) {
            piece.visible = false;
            return;
          }

          piece.x = Math.round(bodyX);
          piece.y = isDownscroll ? roundedY - pieceDistance : roundedY;
          piece.displayHeight = Math.max(1, roundedNextY - roundedY + activeOverlap);
          piece.setFlipY(isDownscroll);
          piece.visible = true;
        });

        const endOriginX = sustain.end.originX !== undefined ? sustain.end.originX : 0;
        const endWidth = sustain.end.displayWidth || 35;
        const endX = strumCenterX - (endWidth * (0.5 - endOriginX)) + offsetX;
        let distanceEnd = (sustain.time + sustain.length - songPos) * 0.45 * this.manager.scrollSpeed;
        let exactEndY = strumCenterY + (isDownscroll ? -distanceEnd : distanceEnd) + offsetY + cropAdjustmentY + this.manager.globalYOffset;
        let endY = Math.round(exactEndY);

        if (isHidden || isFullyConsumed || endY > 3500 || endY < -2000) {
          sustain.end.visible = false;
        } else {
          sustain.end.x = Math.round(endX);
          sustain.end.y = isDownscroll ? endY - sustain.end.displayHeight : endY;
          sustain.end.setFlipY(isDownscroll);
          sustain.end.visible = true;
        }
      }
    });
  }
}
funkin.play.visuals.arrows.notes.SustainRenderer = SustainRenderer;