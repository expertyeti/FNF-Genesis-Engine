/**
 * @file positionCharacters.js
 * Gestiona de manera exclusiva el posicionamiento base, anclaje, escala y profundidad de los personajes.
 * Establece el origen rígido en (0, 0) para delegar los offsets a AnimateCharacters.
 */
class PositionCharacters {
  static apply(sprite, charData, slotData = null) {
    if (!sprite || !sprite.active) return;

    sprite.setOrigin(0, 0);

    let stageX = 0;
    let stageY = 0;

    if (slotData && slotData.position) {
      stageX = slotData.position[0] || 0;
      stageY = slotData.position[1] || 0;
    }

    let charOffsetX = 0;
    let charOffsetY = 0;

    if (charData && charData.position) {
      charOffsetX = charData.position[0] || 0;
      charOffsetY = charData.position[1] || 0;
    }

    let scale = 1;
    if (charData && charData.scale !== undefined) scale = charData.scale;
    if (slotData && slotData.scale !== undefined) scale *= slotData.scale;

    sprite.setScale(scale);

    if (charData && charData.antialiasing === false) {
      if (sprite.texture)
        sprite.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    }

    if (slotData && slotData.layer !== undefined) {
      sprite.setDepth(slotData.layer);
    }

    if (slotData && slotData.scrollFactor !== undefined) {
      if (Array.isArray(slotData.scrollFactor)) {
        sprite.setScrollFactor(
          slotData.scrollFactor[0],
          slotData.scrollFactor[1],
        );
      } else {
        sprite.setScrollFactor(slotData.scrollFactor);
      }
    }

    const finalX = stageX + charOffsetX;
    const finalY = stageY + charOffsetY;

    sprite.setPosition(finalX, finalY);
    sprite.baseX = sprite.x;
    sprite.baseY = sprite.y;
  }
}

funkin.play.visuals.characters.PositionCharacters = PositionCharacters;
