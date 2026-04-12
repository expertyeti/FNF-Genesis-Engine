/**
 * @file src/funkin/play/visuals/arrows/notes/note/logic/syncNotePosition.js
 * Applies geometric bounds dynamically scaling from target strumlines.
 */
funkin.play.visuals.arrows.notes.NoteLogic.prototype.syncNotePosition = function (note, distance, fallbackDownscroll) {
  let strumScale = 1.0;
  let strumBaseScale = 1.0;
  let strumAlpha = 1.0;

  let strumCenterX = 0;
  let strumCenterY = 0;
  
  let isDownscroll = fallbackDownscroll;

  // FIX ESTRICTO: Leemos el boolean asegurado desde la nota
  const isPlayer = note.pType === "pl" || note.isPlayer === true;
  
  const targetStrums = isPlayer ? this.manager.strumlines.playerStrums : this.manager.strumlines.opponentStrums;

  if (targetStrums && targetStrums[note.lane]) {
    const strum = targetStrums[note.lane];
    strumScale = strum.scaleX;
    strumBaseScale = strum.baseScale || 1.0;
    strumAlpha = strum.alpha;

    if (strum.downscroll !== undefined) {
        isDownscroll = strum.downscroll;
    } else if (strum.isDownscroll !== undefined) {
        isDownscroll = strum.isDownscroll;
    }

    const originX = strum.originX !== undefined ? strum.originX : 0.5;
    const originY = strum.originY !== undefined ? strum.originY : 0.5;

    if (strum.currentAction !== "static" && strum.lastStaticWidth) {
      strumCenterX = strum.baseX + strum.lastStaticWidth * (0.5 - originX);
      strumCenterY = strum.baseY + strum.lastStaticHeight * (0.5 - originY);
    } else {
      strum.lastStaticWidth = strum.displayWidth;
      strum.lastStaticHeight = strum.displayHeight;
      strumCenterX = strum.baseX + strum.displayWidth * (0.5 - originX);
      strumCenterY = strum.baseY + strum.displayHeight * (0.5 - originY);
    }
  } else {
    // Fallback de RialNotes
    const fallbackX = funkin.play.visuals.arrows.notes.RialNotes.getXPosition(
      note.lane,
      isPlayer,
      this.manager.strumlines
    );
    const fallbackY = funkin.play.visuals.arrows.notes.RialNotes.getYPosition(
      note.lane,
      isPlayer,
      this.manager.strumlines
    );
    strumCenterX = fallbackX + 56;
    strumCenterY = fallbackY + 56;
  }

  const relativeScale = strumScale / strumBaseScale;
  note.setScale(note.baseScale * relativeScale);

  if (!note.hasMissed && !note.wasHit) {
    note.setAlpha(strumAlpha * note.baseAlpha);
  }

  const noteOriginX = note.originX !== undefined ? note.originX : 0.5;
  const noteOriginY = note.originY !== undefined ? note.originY : 0.5;

  const finalX = strumCenterX - note.displayWidth * (0.5 - noteOriginX) + (note.skinOffset[0] || 0) * relativeScale;
  
  const finalY =
    strumCenterY -
    note.displayHeight * (0.5 - noteOriginY) +
    (isDownscroll ? -distance : distance) +
    (note.skinOffset[1] || 0) * relativeScale +
    this.manager.globalYOffset;

  if (!isNaN(finalX) && !isNaN(finalY)) {
    note.x = Math.round(finalX);
    note.y = Math.round(finalY);
  }
};