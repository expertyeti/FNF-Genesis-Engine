window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.skins = funkin.play.visuals.skins || {};

/**
 * Controlador central del estado de la skin actual.
 * Incluye herramientas globales para Chroma Key suave y Blend Modes.
 */
class PlayUISkins {
    constructor() {
        this.skinData = null;
        this.fallbackSkinData = null; 
        this.overrideSkinName = null;
        this.currentScene = null;
        this.skinName = null;
    }

    isValidPath(pathStr) {
        return funkin.play.visuals.skins.SkinPathResolver?.isValidPath(pathStr) ?? false;
    }

    getAssetKey(originalPath) {
        return funkin.play.visuals.skins.SkinPathResolver?.getAssetKey(originalPath, this.skinData) ?? originalPath;
    }

    /**
     * Carga los metadatos de la skin.
     */
    async loadSkinData(skinName = null, forceReload = false) {
        const chart = funkin.play.chart;
        
        let targetSkin = skinName || this.overrideSkinName;
        
        if (!targetSkin && chart) {
            if (typeof chart.get === 'function') {
                targetSkin = chart.get('skins.ui') ||              
                             chart.get('metadata.skins.ui') ||     
                             chart.get('base.skins.ui') ||         
                             chart.get('metadata.skin');           
            }

            if (!targetSkin) {
                targetSkin = chart.metadata?.skins?.ui || 
                             chart.base?.skins?.ui || 
                             chart.skins?.ui;
            }
        }

        this.skinName = targetSkin || "funkin";
        console.log(`[PlayUISkins] Skin resuelta para cargar: "${this.skinName}"`);

        const Loader = funkin.play.visuals.skins.SkinDataLoader;
        if (Loader) {
            const loadedData = await Loader.load(this.skinName, forceReload);
            this.skinData = loadedData.skinData;
            this.fallbackSkinData = loadedData.fallbackSkinData;
        }

        return this.skinData;
    }

    async preloadSkinAssets(scene, forceReload = false) {
        this.currentScene = scene;
        const PreloaderClass = funkin.play.visuals.skins.SkinPreloader;
        return PreloaderClass ? await new PreloaderClass().preload(scene, this) : undefined;
    }

    get(path) {
        return funkin.play.visuals.skins.SkinPathResolver?.get(this.skinData, this.fallbackSkinData, path);
    }

    /**
     * Consulta si la skin actual permite Antialiasing
     * @returns {boolean}
     */
    getAntialiasing() {
        if (this.skinData?.global?.antialiasing !== undefined) return this.skinData.global.antialiasing;
        if (this.fallbackSkinData?.global?.antialiasing !== undefined) return this.fallbackSkinData.global.antialiasing;
        return true; // Por defecto true (smooth)
    }

    async setOverrideSkin(skinName) {
        this.overrideSkinName = skinName;
        await this.reloadActiveSkin();
    }

    async reloadActiveSkin() {
        if (!this.currentScene) return;
        
        await this.loadSkinData(null, true);
        await this.preloadSkinAssets(this.currentScene, false);

        if (this.currentScene.load.isLoading() || this.currentScene.load.totalToLoad > 0) {
            await new Promise((resolve) => {
                this.currentScene.load.once("complete", resolve);
                if (!this.currentScene.load.isLoading()) this.currentScene.load.start();
            });
        }

        this.currentScene.events?.emit('ui_skin_changed');
    }

    applyChromaKey(scene, assetKey, hexColor) {
        const tex = scene?.textures?.get(assetKey);
        if (!tex || tex.customChromaKeyApplied || !hexColor) return;

        let hex = String(hexColor).replace('#', '').trim();
        hex = hex.length === 3 ? hex.split('').map(c => c + c).join('') : (hex.length === 5 ? hex + '0' : hex);
        if (hex.length !== 6) hex = '000000';

        const [tR, tG, tB] = [parseInt(hex.substring(0, 2), 16), parseInt(hex.substring(2, 4), 16), parseInt(hex.substring(4, 6), 16)];

        tex.source.forEach(source => {
            if (!source.image) return;

            const canvas = document.createElement('canvas');
            canvas.width = source.width;
            canvas.height = source.height;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            
            ctx.drawImage(source.image, 0, 0);
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;

            for (let i = 0; i < data.length; i += 4) {
                if (data[i + 3] === 0) continue; 
                const dist = Math.sqrt((data[i] - tR)**2 + (data[i + 1] - tG)**2 + (data[i + 2] - tB)**2);
                data[i + 3] = dist <= 25 ? 0 : (dist <= 110 ? Math.floor(data[i + 3] * ((dist - 25) / 85)) : data[i + 3]);
            }

            ctx.putImageData(imgData, 0, 0);
            source.image = canvas;
            source.isCanvas = true;
            source.update(); 
        });
        
        tex.customChromaKeyApplied = true;
    }

    applyBlendMode(gameObject, blendModeString) {
        funkin.play.BlendMode?.apply?.(gameObject, blendModeString);
    }
}

funkin.play.visuals.skins.PlayUISkins = PlayUISkins;
funkin.play.uiSkins = new PlayUISkins();