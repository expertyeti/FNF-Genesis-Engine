/**
 * Processes graphic interpolation and dynamic visual cropping of sustained notes.
 */
class SustainRenderer {
  constructor(manager) {
    this.manager = manager;
    this.scene = manager.scene;
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

    for (let i = 0; i < this.manager.maskGraphicsList.length; i++) {
      this.manager.maskGraphicsList[i].clear();
      this.manager.maskGraphicsList[i].fillStyle(0xffffff, 1);
    }

    for (let lane = 0; lane < this.manager.keyCount; lane++) {
      let sOffsetOpp = 0,
        sOffsetXOpp = 0,
        oppHitAdjust = 0;
      let sOffsetP = 0,
        sOffsetXP = 0,
        pHitAdjust = 0;

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
        let bX = strum ? strum.baseX : funkin.RialNotes.getXPosition(lane, isPlayer, this.manager.strumlines);
        let bY = strum ? strum.baseY : funkin.RialNotes.getYPosition(lane, isPlayer, this.manager.strumlines);

        if (!isNaN(bX) && !isNaN(bY)) {
          let relativeScale = strum ? strum.scaleX / (strum.baseScale || 1) : 1;
          
          let strumCenterY = bY + 56 * relativeScale;
          let strumCenterX = bX + 56 * relativeScale;

          if (strum) {
            const originX = strum.originX !== undefined ? strum.originX : 0.5;
            const originY = strum.originY !== undefined ? strum.originY : 0.5;
            strumCenterX = strum.baseX + (strum.displayWidth * (0.5 - originX));
            strumCenterY = strum.baseY + (strum.displayHeight * (0.5 - originY));
          }

          let actualY = strumCenterY + this.manager.globalYOffset;
          let isDown = actualY > this.scene.scale.height / 2;
          let hitAdj = (isPlayer ? pHitAdjust : oppHitAdjust) * relativeScale;
          let offY = (isPlayer ? sOffsetP : sOffsetOpp) * relativeScale;
          let offX = (isPlayer ? sOffsetXP : sOffsetXOpp) * relativeScale;

          let maskY = actualY + globalSkinOffsetY + offY + hitAdj;
          let maskX = strumCenterX - (this.manager.maskWidth / 2) + offX;

          if (isDown) maskGraphic.fillRect(maskX, -2000, this.manager.maskWidth, maskY + 2000);
          else maskGraphic.fillRect(maskX, maskY, this.manager.maskWidth, 4000);
        }
      };

      applyMask(
        this.manager.strumlines?.opponentStrums[lane],
        this.manager.maskGraphicsList[lane],
        lane,
        false
      );
      applyMask(
        this.manager.strumlines?.playerStrums[lane],
        this.manager.maskGraphicsList[this.manager.keyCount + lane],
        lane,
        true
      );
    }
  }

  updateTransforms() {
    const globalDownscroll = funkin.play.options && funkin.play.options.downscroll;
    const midScrollOption = funkin.play.options && funkin.play.options.middlescroll;
    const isMobile = midScrollOption === "mobile";
    const isSplit = midScrollOption === "split";
    const hideEnemy = funkin.play.options && funkin.play.options.hideOpponentNotes;
    
    const playAsOpponent = funkin.play.options && funkin.play.options.playAsOpponent;
    const songPos = funkin.conductor.songPosition;

    this.manager.sustains.forEach((sustain) => {
      if (!sustain.active) return;

      let strumScale = 1.0;
      let strumBaseScale = 1.0;
      let strumAlpha = 1.0;

      let strumCenterX = 0;
      let strumCenterY = 0;

      const targetStrums = sustain.isPlayer
        ? this.manager.strumlines?.playerStrums
        : this.manager.strumlines?.opponentStrums;

      if (targetStrums && targetStrums[sustain.lane]) {
        const strum = targetStrums[sustain.lane];
        strumScale = strum.scaleX;
        strumBaseScale = strum.baseScale || 1.0;
        strumAlpha = strum.alpha;

        const originX = strum.originX !== undefined ? strum.originX : 0.5;
        const originY = strum.originY !== undefined ? strum.originY : 0.5;
        strumCenterX = strum.baseX + (strum.displayWidth * (0.5 - originX));
        strumCenterY = strum.baseY + (strum.displayHeight * (0.5 - originY));
      } else {
        let fallbackX = funkin.RialNotes.getXPosition(sustain.lane, sustain.isPlayer, this.manager.strumlines);
        let fallbackY = funkin.RialNotes.getYPosition(sustain.lane, sustain.isPlayer, this.manager.strumlines);
        strumCenterX = fallbackX + 56;
        strumCenterY = fallbackY + 56;
      }

      const isMyNote = playAsOpponent ? !sustain.isPlayer : sustain.isPlayer;
      let isDownscroll = globalDownscroll;
      if (isMobile) {
        isDownscroll = isMyNote; 
      } else if (isSplit && !isMyNote) {
        isDownscroll = false;
      }

      const relativeScale = strumScale / strumBaseScale;
      const finalScale = sustain.baseScale * relativeScale;

      if (sustain.parentMissed) {
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

      const isHidden = hideEnemy && !isMyNote;
      
      const offsetX = (sustain.skinOffset[0] || 0) * relativeScale;
      const offsetY = (sustain.skinOffset[1] || 0) * relativeScale;
      let cropAdjustmentY = (sustain.hasBeenHit ? (sustain.skinOffsetHit[1] || 0) : 0) * relativeScale;
      const isFullyConsumed = sustain.hasBeenHit && (songPos > sustain.time + sustain.length || sustain.earlyReleaseCompleted);

      if (!isNaN(strumCenterX) && !isNaN(strumCenterY)) {
        const activeOverlap = sustain.baseAlpha < 1.0 ? 0 : this.manager.sustainOverlap;

        sustain.bodyParts.forEach((piece) => {
          if (sustain.consumedTime > 0) {
            let pieceEndTime = piece.pieceTime + piece.chunkMs;
            if (pieceEndTime <= sustain.time + sustain.consumedTime) {
              if (piece.visible) {
                piece.visible = false;
                if (sustain.isPlayer && typeof navigator !== "undefined" && navigator.vibrate) {
                  navigator.vibrate(8);
                }
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

          let baseY =
            strumCenterY +
            (isDownscroll ? -distanceStart : distanceStart) +
            offsetY +
            cropAdjustmentY +
            this.manager.globalYOffset;

          let roundedY = Math.round(baseY);
          let roundedNextY = Math.round(baseY + pieceDistance);

          if (isHidden || roundedY > 3500 || roundedNextY < -2000 || isFullyConsumed) {
            piece.visible = false;
            return;
          }

          piece.x = Math.round(bodyX);
          piece.y = isDownscroll ? roundedY - pieceDistance : roundedY;
          piece.displayHeight = Math.max(1, roundedNextY - roundedY + activeOverlap);
          piece.visible = true;
        });

        const endOriginX = sustain.end.originX !== undefined ? sustain.end.originX : 0;
        const endWidth = sustain.end.displayWidth || 35;
        const endX = strumCenterX - (endWidth * (0.5 - endOriginX)) + offsetX;
        
        let distanceEnd = (sustain.time + sustain.length - songPos) * 0.45 * this.manager.scrollSpeed;

        let exactEndY =
          strumCenterY +
          (isDownscroll ? -distanceEnd : distanceEnd) +
          offsetY +
          cropAdjustmentY +
          this.manager.globalYOffset;
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

if (typeof window !== "undefined") funkin.SustainRenderer = SustainRenderer;