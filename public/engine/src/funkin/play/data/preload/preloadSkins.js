/**
 * Pre-carga de assets visuales y de audio para la interfaz de usuario en escena.
 */
class SkinPreloader {
    constructor() {
        this.loadedAssets = [];
    }

    async preload(scene, uiManager) {
        if (!scene?.load) return;
        scene.load.imageBitmapFormat = true;

        if (!uiManager?.skinData && !uiManager?.fallbackSkinData) return;

        const mainPath = uiManager.skinData?.global?.basePath || "funkin";
        const fallbackPath = uiManager.fallbackSkinData?.global?.basePath || "funkin";
        const baseUrl = window.BASE_URL || "";
        
        this.loadedAssets = [];

        const loadAsset = (type, path, isAtlas, isFallback) => {
            if (!uiManager.isValidPath(path)) return;
            const key = uiManager.getAssetKey(path);
            
            if (!key || scene.textures.exists(key) || scene.cache.audio.exists(key)) {
                if (type === "image" && key) this.loadedAssets.push(key);
                return;
            }

            const fileUrl = `${baseUrl}assets/images/skins/${isFallback ? fallbackPath : mainPath}/${path}`;

            if (type === "image") {
                isAtlas ? scene.load.atlasXML(key, `${fileUrl}.png`, `${fileUrl}.xml`) : scene.load.image(key, `${fileUrl}.png`);
                if (isAtlas) scene.load.text(`${key}_rawXML`, `${fileUrl}.xml`);
                this.loadedAssets.push(key);
            } else if (type === "audio") {
                scene.load.audio(key, `${fileUrl}.ogg`);
            }
        };

        const resolve = (pathStr, type, isAtlas) => {
            const paths = [
                pathStr, 
                pathStr.startsWith("bars.") ? `ui.${pathStr}` : null, 
                pathStr.startsWith("ui.bars.") ? pathStr.replace("ui.", "") : null
            ].filter(Boolean);

            const check = (data, p) => p.split(".").reduce((acc, part) => acc?.[part], data);

            for (const p of paths) {
                let val = check(uiManager.skinData, p);
                if (val && uiManager.isValidPath(val)) return loadAsset(type, val, isAtlas, false);
                
                val = check(uiManager.fallbackSkinData, p);
                if (val && uiManager.isValidPath(val)) return loadAsset(type, val, isAtlas, true);
            }
        };

        resolve("gameplay.strumline.assetPath", "image", true);
        resolve("gameplay.notes.assetPath", "image", true);
        resolve("gameplay.sustains.assetPath", "image", true);
        resolve("gameplay.noteSplashes.assetPath", "image", true);

        ["left", "down", "up", "right"].forEach(d => resolve(`gameplay.holdCovers.directions.${d}.assetPath`, "image", true));
        ["three", "two", "one", "go"].forEach(s => (resolve(`ui.countdown.${s}.audio.assetPath`, "audio", false), resolve(`ui.countdown.${s}.image.assetPath`, "image", false)));
        ["perfect", "sick", "good", "bad", "shit"].forEach(j => resolve(`ui.judgments.${j}.assetPath`, "image", false));
        for (let i = 0; i <= 9; i++) resolve(`ui.comboNumbers.assets.${i}`, "image", false);
        resolve("ui.bars.health.path", "image", false);
        resolve("ui.bars.time.path", "image", false);

        scene.events?.once('create', () => {
            const filterMode = Phaser.Textures.FilterMode?.NEAREST ?? 0;
            this.loadedAssets.forEach(k => scene.textures.exists(k) && scene.textures.get(k).setFilter(filterMode));
        });
    }
}

funkin.play.visuals.skins.SkinPreloader = SkinPreloader;