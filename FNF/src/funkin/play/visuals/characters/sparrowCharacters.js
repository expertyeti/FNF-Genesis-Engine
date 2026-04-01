window.funkin = window.funkin || {};
window.funkin.play = window.funkin.play || {};

/**
 * Initializes and renders characters processed via Sparrow atlas.
 */
funkin.play.SparrowCharacters = class {
  /**
   * @param {Phaser.Scene} scene
   * @param {string} stageName
   */
  static async execute(scene, stageName) {
    scene.stageCharacters = scene.stageCharacters || {};
    let stageData = null;

    if (funkin.play.stageManager && funkin.play.stageManager.stageData) {
      stageData = funkin.play.stageManager.stageData;
    } else if (scene.cache.json.exists(stageName)) {
      stageData = scene.cache.json.get(stageName);
    } else {
      try {
        const response = await fetch(`public/data/stages/${stageName}.json`);
        if (response.ok) {
          stageData = await response.json();
        } else {
          const altResponse = await fetch(`public/stages/${stageName}.json`);
          if (altResponse.ok) stageData = await altResponse.json();
        }
      } catch (error) {
        console.warn(`Failed to fetch stage data for ${stageName}`, error);
      }
    }

    if (!stageData || !funkin.play.PropsCharacters) return;

    const slots = funkin.play.PropsCharacters.findCharacterSlots(stageData);
    if (slots.length === 0) return;

    slots.forEach((slot) => {
      let charDef = funkin.play.PropsCharacters.getCharData(slot.role);
      let type = charDef && charDef.type ? charDef.type : "sparrow";
      let texKey = charDef ? charDef.key : null;
      let isFallback = false;
      let errorMsg = "";

      if (!charDef) {
        isFallback = true;
        errorMsg = `DATA NOT FOUND`;
      } else if (type === "sparrow" && (!scene.textures.exists(texKey) || scene.textures.get(texKey).key === "__MISSING")) {
        isFallback = true;
        errorMsg = `GET '${texKey}' 404`;
      } else if (type === "atlas" && !scene.textures.exists(`${texKey}_spritemap`)) {
        isFallback = true;
        errorMsg = `GET '${texKey}_spritemap' 404`;
      }

      if (isFallback) {
        const bfDef = funkin.play.PropsCharacters.getFallbackData(scene);
        if (bfDef) {
          texKey = bfDef.key;
          charDef = bfDef;
          type = bfDef.type || "sparrow";
        } else {
          return;
        }
      }

      if (type !== "sparrow") return;

      const xmlText = scene.cache.text.get(`${texKey}_xml`);
      if (xmlText && funkin.animation && funkin.animation.sparrow) {
        funkin.animation.sparrow.fixPhaserSparrow(scene, texKey, xmlText);
      }

      const sprite = scene.add.sprite(0, 0, texKey);

      const useAntialiasing = charDef.data.antialiasing !== false;
      if (!useAntialiasing) sprite.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
      else sprite.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);

      funkin.play.PropsCharacters.applyProps(scene, sprite, slot, charDef, isFallback, errorMsg, false);
    });
  }
};