/**
 * @file preloadSkins.js
 * Optimizado: Extracción fluida de paths y uso del Batch global.
 */
class SkinPreloader {
    constructor() {
        this.loadedAssets = [];
    }

    async preload(scene, uiSkinsManager) {
        scene.load.imageBitmapFormat = true;

        if (!uiSkinsManager?.skinData && !uiSkinsManager?.fallbackSkinData) return;

        const mainPath = uiSkinsManager.skinData?.global?.basePath || "Funkin";
        const fallbackPath = uiSkinsManager.fallbackSkinData?.global?.basePath || "Funkin";
        const baseUrl = window.BASE_URL || "";

        this.loadedAssets = [];

        const loadAsset = (type, originalPath, isAtlas = false, isFallback = false) => {
            if (!uiSkinsManager.isValidPath(originalPath)) return;

            const sessionKey = uiSkinsManager.getAssetKey(originalPath);
            if (!sessionKey) return;

            if (scene.textures.exists(sessionKey) || scene.cache.audio.exists(sessionKey)) {
                if (type === "image") this.loadedAssets.push(sessionKey);
                return;
            }

            const sourcePath = isFallback ? fallbackPath : mainPath;
            const fileUrl = `${baseUrl}assets/images/skins/${sourcePath}/${originalPath}`;

            if (type === "image" && !isAtlas) {
                scene.load.image(sessionKey, `${fileUrl}.png`);
                this.loadedAssets.push(sessionKey);
            } else if (type === "image" && isAtlas) {
                scene.load.atlasXML(sessionKey, `${fileUrl}.png`, `${fileUrl}.xml`);
                scene.load.text(`${sessionKey}_rawXML`, `${fileUrl}.xml`);
                this.loadedAssets.push(sessionKey);
            } else if (type === "audio") {
                scene.load.audio(sessionKey, `${fileUrl}.ogg`);
            }
        };

        const resolveAsset = (pathStr, type, isAtlas) => {
            const tryPaths = [pathStr];
            if (pathStr.startsWith("bars.")) tryPaths.push("ui." + pathStr);
            if (pathStr.startsWith("ui.bars.")) tryPaths.push(pathStr.replace("ui.", ""));

            const checkData = (data, p) => {
                if (!data) return undefined;
                return p.split(".").reduce((acc, part) => acc && acc[part], data);
            };

            for (const p of tryPaths) {
                const val = checkData(uiSkinsManager.skinData, p);
                if (val && uiSkinsManager.isValidPath(val)) return loadAsset(type, val, isAtlas, false);
            }

            for (const p of tryPaths) {
                const val = checkData(uiSkinsManager.fallbackSkinData, p);
                if (val && uiSkinsManager.isValidPath(val)) return loadAsset(type, val, isAtlas, true);
            }
        };

        // Encolar UI general
        resolveAsset("gameplay.strumline.assetPath", "image", true);
        resolveAsset("gameplay.notes.assetPath", "image", true);
        resolveAsset("gameplay.sustains.assetPath", "image", true);
        resolveAsset("gameplay.noteSplashes.assetPath", "image", true);

        ["left", "down", "up", "right"].forEach(dir => resolveAsset(`gameplay.holdCovers.directions.${dir}.assetPath`, "image", true));
        ["three", "two", "one", "go"].forEach(step => {
            resolveAsset(`ui.countdown.${step}.audio.assetPath`, "audio", false);
            resolveAsset(`ui.countdown.${step}.image.assetPath`, "image", false);
        });
        ["perfect", "sick", "good", "bad", "shit"].forEach(judg => resolveAsset(`ui.judgments.${judg}.assetPath`, "image", false));
        for (let i = 0; i <= 9; i++) resolveAsset(`ui.comboNumbers.assets.${i}`, "image", false);
        resolveAsset("ui.bars.health.path", "image", false);
        resolveAsset("ui.bars.time.path", "image", false);

        // Agregamos un evento para aplicar los filtros SOLO cuando la escena se haya cargado
        scene.events.once('create', () => {
            const filterMode = Phaser.Textures.FilterMode ? Phaser.Textures.FilterMode.NEAREST : 0;
            this.loadedAssets.forEach(key => {
                if (scene.textures.exists(key)) scene.textures.get(key).setFilter(filterMode);
            });
        });
    }
}

funkin.play.visuals.skins.SkinPreloader = SkinPreloader;
funkin.play.uiSkins = new SkinPreloader();