/**
 * @file propsCharacters.js
 * Centralizes the retrieval of character data, offsets and properties.
 * Implements strict anchoring logic (Hitbox/Feet) to align sprites to the ground.
 */
class PropsCharacters {
  static getCharData(role) {
    const loadedCharacters = funkin.play.data.sources.PreloadCharacters
      ? funkin.play.data.sources.PreloadCharacters.loadedKeys
      : null;
    if (!loadedCharacters) return null;

    const r = role.toLowerCase();
    if (
      r.includes("enemy") ||
      r.includes("opponent") ||
      r.includes("dad") ||
      r.includes("boss")
    )
      return loadedCharacters.opponents[0];
    if (
      r.includes("playergf") ||
      r.includes("gf") ||
      r.includes("spectator") ||
      r.includes("girl")
    )
      return loadedCharacters.spectator[0];
    if (r.includes("player") || r.includes("boyfriend") || r.includes("bf"))
      return loadedCharacters.players[0];
    return null;
  }

  static getFallbackData(scene) {
    let bfData = scene.cache.json.get("bf");
    if (bfData) {
      return { key: "bf", type: bfData.type || "sparrow", data: bfData };
    }
    const loadedCharacters = funkin.play.data.sources.PreloadCharacters
      ? funkin.play.data.sources.PreloadCharacters.loadedKeys
      : null;
    if (
      loadedCharacters &&
      loadedCharacters.players &&
      loadedCharacters.players.length > 0
    ) {
      return loadedCharacters.players[0];
    }
    return null;
  }

  static findCharacterSlots(data, result = []) {
    if (Array.isArray(data)) {
      data.forEach((item) => this.findCharacterSlots(item, result));
    } else if (typeof data === "object" && data !== null) {
      for (const key in data) {
        if (data[key] && data[key].type === "character")
          result.push({ role: key, props: data[key] });
        else this.findCharacterSlots(data[key], result);
      }
    }
    return result;
  }

  static applyProps(
    scene,
    sprite,
    slot,
    charDef,
    isFallback,
    errorMsg,
    isAtlas,
  ) {
    const props = slot.props;

    let feetPosX =
      props.position && props.position.length >= 2 ? props.position[0] : 0;
    let feetPosY =
      props.position && props.position.length >= 2 ? props.position[1] : 0;

    if (!scene.debugCharacterPositions) {
      scene.debugCharacterPositions = {};
    }
    scene.debugCharacterPositions[slot.role] = { x: feetPosX, y: feetPosY };

    if (charDef && charDef.data) sprite.charData = charDef.data;

    if (funkin.play.data.camera && funkin.play.data.camera.addObjToGame)
      funkin.play.data.camera.addObjToGame(sprite);
    if (props.layer !== undefined && sprite.setDepth)
      sprite.setDepth(props.layer);
    if (props.visible !== undefined && sprite.setVisible)
      sprite.setVisible(props.visible);
    if (props.opacity !== undefined && !isFallback && sprite.setAlpha)
      sprite.setAlpha(props.opacity);

    if (props.blendMode && funkin.play.uiSkins) {
      funkin.play.uiSkins.applyBlendMode(sprite, props.blendMode);
    } else if (charDef.data && charDef.data.blendMode && funkin.play.uiSkins) {
      funkin.play.uiSkins.applyBlendMode(sprite, charDef.data.blendMode);
    }

    const charScale = charDef.data.scale !== undefined ? charDef.data.scale : 1;
    const stageScale = props.scale !== undefined ? props.scale : 1;
    const totalScale = charScale * stageScale;

    const charBaseFlipX =
      charDef.data &&
      (charDef.data.flip_x === true || charDef.data.flipX === true);
    let finalFlipX = charBaseFlipX;
    if (props.flip_x !== undefined) finalFlipX = charBaseFlipX !== props.flip_x;

    if (isFallback) {
      const r = slot.role.toLowerCase();
      if (
        r.includes("enemy") ||
        r.includes("opponent") ||
        r.includes("dad") ||
        r.includes("boss")
      )
        finalFlipX = !finalFlipX;
    }

    if (sprite.setOrigin) sprite.setOrigin(0, 0);

    let texKey = charDef && charDef.key ? charDef.key : null;
    if (!texKey && sprite && sprite.texture && sprite.texture.key)
      texKey = sprite.texture.key;

    if (isAtlas) {
      sprite.scaleX = finalFlipX ? -Math.abs(totalScale) : Math.abs(totalScale);
      sprite.scaleY = Math.abs(totalScale);
    } else {
      if (sprite.setScale) sprite.setScale(totalScale);
      if (sprite.setFlipX) sprite.setFlipX(finalFlipX);
      if (props.flip_y !== undefined && sprite.setFlipY)
        sprite.setFlipY(props.flip_y);

      if (texKey) {
        const frameNames = scene.textures
          .get(texKey)
          .getFrameNames()
          .filter((n) => n !== "__BASE");
        if (frameNames.length > 0) {
          let targetFrame = frameNames.find(
            (n) =>
              n.toLowerCase().includes("idle") ||
              n.toLowerCase().includes("dance"),
          );
          if (!targetFrame) targetFrame = frameNames[0];
          if (sprite.setFrame) sprite.setFrame(targetFrame);
        }
      }
    }

    let hitBoxWidth = 0;
    let hitBoxHeight = 0;

    if (isAtlas) {
      hitBoxWidth = (sprite.width || 150) * Math.abs(totalScale);
      hitBoxHeight = (sprite.height || 150) * Math.abs(totalScale);
    } else if (texKey) {
      hitBoxWidth = Math.abs(
        sprite.width * totalScale || sprite.displayWidth || 0,
      );
      hitBoxHeight = Math.abs(
        sprite.height * totalScale || sprite.displayHeight || 0,
      );
    }

    let characterOriginX = hitBoxWidth / 2;
    let characterOriginY = hitBoxHeight;

    let globalOffsetX =
      charDef.data.position && charDef.data.position.length >= 2
        ? charDef.data.position[0]
        : 0;
    let globalOffsetY =
      charDef.data.position && charDef.data.position.length >= 2
        ? charDef.data.position[1]
        : 0;

    sprite.x = feetPosX - characterOriginX + globalOffsetX;
    sprite.y = feetPosY - characterOriginY + globalOffsetY;

    if (charDef.data.origin) {
      sprite.x -= charDef.data.origin[0];
      sprite.y -= charDef.data.origin[1];
    } else if (props.origin) {
      sprite.x -= props.origin[0];
      sprite.y -= props.origin[1];
    }

    sprite.baseX = sprite.x;
    sprite.baseY = sprite.y;

    const scrollX = props.scrollFactor !== undefined ? props.scrollFactor : 1;
    const scrollY = props.scrollFactor !== undefined ? props.scrollFactor : 1;
    if (sprite.setScrollFactor) sprite.setScrollFactor(scrollX, scrollY);

    if (scene.animateCharacters && charDef.data) {
      scene.animateCharacters.addCharacter(slot.role, sprite, charDef.data);
    }

    if (isFallback && funkin.play.visuals.characters.FallbackCharacters) {
      funkin.play.visuals.characters.FallbackCharacters.apply(
        scene,
        sprite,
        errorMsg,
        feetPosX,
        scrollX,
        scrollY,
        props.layer,
      );
    }

    scene.stageCharacters[slot.role] = sprite;
    const r = slot.role.toLowerCase();
    if (
      r.includes("enemy") ||
      r.includes("opponent") ||
      r.includes("dad") ||
      r.includes("boss")
    )
      scene.stageCharacters.enemy = sprite;
    else if (
      r.includes("playergf") ||
      r.includes("gf") ||
      r.includes("spectator") ||
      r.includes("girl")
    )
      scene.stageCharacters.spectator = sprite;
    else if (
      r.includes("player") ||
      r.includes("boyfriend") ||
      r.includes("bf")
    )
      scene.stageCharacters.player = sprite;
  }
}

funkin.play.visuals.characters.PropsCharacters = PropsCharacters;
