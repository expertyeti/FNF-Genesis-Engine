/**
 * @file preloadSkins.js
 * Se encarga exclusivamente de la precarga de assets (imágenes, xml, audios)
 * basándose en los datos administrados por PlayUISkins.
 */
class SkinPreloader {
  constructor() {
    this.loadedAssets = [];
  }

  async preload(scene, uiSkinsManager) {
    return new Promise((resolve) => {
      if (!uiSkinsManager.skinData && !uiSkinsManager.fallbackSkinData)
        return resolve();

      const mainPath =
        uiSkinsManager.skinData &&
        uiSkinsManager.skinData.global &&
        uiSkinsManager.skinData.global.basePath
          ? uiSkinsManager.skinData.global.basePath
          : "Funkin";
      const fallbackPath =
        uiSkinsManager.fallbackSkinData &&
        uiSkinsManager.fallbackSkinData.global &&
        uiSkinsManager.fallbackSkinData.global.basePath
          ? uiSkinsManager.fallbackSkinData.global.basePath
          : "Funkin";

      let assetsToLoad = 0;
      this.loadedAssets = [];

      const loadAsset = (
        type,
        originalPath,
        isAtlas = false,
        isFallback = false,
      ) => {
        if (!uiSkinsManager.isValidPath(originalPath)) return;

        const sessionKey = uiSkinsManager.getAssetKey(originalPath);
        if (!sessionKey) return;

        if (
          scene.textures.exists(sessionKey) ||
          scene.cache.audio.exists(sessionKey)
        ) {
          if (type === "image") this.loadedAssets.push(sessionKey);
          return;
        }

        const sourcePath = isFallback ? fallbackPath : mainPath;
        const fileUrl = `${window.BASE_URL}assets/images/skins/${sourcePath}/${originalPath}`;

        if (type === "image" && !isAtlas) {
          scene.load.image(sessionKey, `${fileUrl}.png`);
          assetsToLoad++;
          this.loadedAssets.push(sessionKey);
        } else if (type === "image" && isAtlas) {
          scene.load.atlasXML(sessionKey, `${fileUrl}.png`, `${fileUrl}.xml`);
          scene.load.text(`${sessionKey}_rawXML`, `${fileUrl}.xml`);
          assetsToLoad += 2;
          this.loadedAssets.push(sessionKey);
        } else if (type === "audio") {
          scene.load.audio(sessionKey, `${fileUrl}.ogg`);
          assetsToLoad++;
        }
      };

      const resolveAsset = (pathStr, type, isAtlas) => {
        const tryPaths = [pathStr];
        if (pathStr.startsWith("bars.")) tryPaths.push("ui." + pathStr);
        if (pathStr.startsWith("ui.bars."))
          tryPaths.push(pathStr.replace("ui.", ""));

        const checkData = (data, p) => {
          if (!data) return undefined;
          const keys = p.split(".");
          let current = data;
          for (const key of keys) {
            if (current === undefined || current === null) return undefined;
            current = current[key];
          }
          if (uiSkinsManager.isValidPath(current)) return current;
          return undefined;
        };

        for (const p of tryPaths) {
          let val = checkData(uiSkinsManager.skinData, p);
          if (val !== undefined) {
            loadAsset(type, val, isAtlas, false);
            return;
          }
        }

        for (const p of tryPaths) {
          let val = checkData(uiSkinsManager.fallbackSkinData, p);
          if (val !== undefined) {
            loadAsset(type, val, isAtlas, true);
            return;
          }
        }
      };

      resolveAsset("gameplay.strumline.assetPath", "image", true);
      resolveAsset("gameplay.notes.assetPath", "image", true);
      resolveAsset("gameplay.sustains.assetPath", "image", true);
      resolveAsset("gameplay.noteSplashes.assetPath", "image", true);

      ["left", "down", "up", "right"].forEach((dir) => {
        resolveAsset(
          `gameplay.holdCovers.directions.${dir}.assetPath`,
          "image",
          true,
        );
      });

      ["three", "two", "one", "go"].forEach((step) => {
        resolveAsset(`ui.countdown.${step}.audio.assetPath`, "audio", false);
        resolveAsset(`ui.countdown.${step}.image.assetPath`, "image", false);
      });

      ["perfect", "sick", "good", "bad", "shit"].forEach((judg) => {
        resolveAsset(`ui.judgments.${judg}.assetPath`, "image", false);
      });

      for (let i = 0; i <= 9; i++) {
        resolveAsset(`ui.comboNumbers.assets.${i}`, "image", false);
      }

      resolveAsset("ui.bars.health.path", "image", false);
      resolveAsset("ui.bars.time.path", "image", false);

      const applyFilters = () => {
        const filterMode = Phaser.Textures.FilterMode
          ? Phaser.Textures.FilterMode.NEAREST
          : 0;
        this.loadedAssets.forEach((key) => {
          if (scene.textures.exists(key))
            scene.textures.get(key).setFilter(filterMode);
        });
      };

      if (assetsToLoad === 0) {
        applyFilters();
        return resolve();
      }

      scene.load.once("complete", () => {
        applyFilters();
        resolve();
      });
      scene.load.start();
    });
  }
}

funkin.play.visuals.skins.SkinPreloader = SkinPreloader;

// Instancia global
funkin.play.uiSkins = new SkinPreloader();
