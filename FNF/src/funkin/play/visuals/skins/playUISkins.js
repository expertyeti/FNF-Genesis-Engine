/**
 * @file src/funkin/play/visuals/skins/playUISkins.js
 * Controlador (Facade) que mantiene el estado de la skin actual.
 * Contiene utilidades globales para Chroma Key Suave (Feathering) y Blend Modes.
 */

class PlayUISkins {
    constructor() {
        this.skinData = null;
        this.fallbackSkinData = null; 
        this.overrideSkinName = null;
        this.currentScene = null;
    }

    isValidPath(pathStr) {
        return funkin.play.SkinPathResolver.isValidPath(pathStr);
    }

    getAssetKey(originalPath) {
        return funkin.play.SkinPathResolver.getAssetKey(originalPath, this.skinData);
    }

    async loadSkinData(forceReload = false) {
        let skinName = this.overrideSkinName;
        
        if (!skinName || String(skinName).trim() === "") {
            if (funkin.play && funkin.play.chart) {
                skinName = funkin.play.chart.get('metadata.skin');
            }
        }

        const loadedData = await funkin.play.SkinDataLoader.load(skinName, forceReload);
        
        this.skinData = loadedData.skinData;
        this.fallbackSkinData = loadedData.fallbackSkinData;

        return this.skinData;
    }

    async preloadSkinAssets(scene, forceReload = false) {
        this.currentScene = scene;
        if (funkin.play.skinPreloader) {
            return await funkin.play.skinPreloader.preload(scene, this);
        } else {
            console.error("El módulo skinPreloader no está definido.");
        }
    }

    get(path) {
        return funkin.play.SkinPathResolver.get(this.skinData, this.fallbackSkinData, path);
    }

    async setOverrideSkin(skinName) {
        this.overrideSkinName = skinName;
        await this.reloadActiveSkin();
    }

    async reloadActiveSkin() {
        if (!this.currentScene) return;
        await this.loadSkinData(true);
        await this.preloadSkinAssets(this.currentScene, false);
        this.currentScene.events.emit('ui_skin_changed');
    }

    // ==========================================
    // GLOBAL CHROMA KEY (SMOOTH/FEATHERING)
    // ==========================================
    applyChromaKey(scene, assetKey, hexColor) {
        if (!scene || !assetKey || !hexColor) return;
        const tex = scene.textures.get(assetKey);
        if (!tex || tex.customChromaKeyApplied) return;

        let hex = String(hexColor).replace('#', '').trim();
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        if (hex.length === 5) hex = hex + '0'; 
        if (hex.length !== 6) hex = '000000';

        const targetR = parseInt(hex.substring(0, 2), 16);
        const targetG = parseInt(hex.substring(2, 4), 16);
        const targetB = parseInt(hex.substring(4, 6), 16);

        // [NUEVO] Tolerancia para cortes duros y Smoothing para degradados Alpha
        const tolerance = 25;  
        const smoothing = 85;  

        tex.source.forEach(source => {
            const image = source.image;
            if (!image) return;

            const canvas = document.createElement('canvas');
            canvas.width = source.width;
            canvas.height = source.height;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            
            ctx.drawImage(image, 0, 0);

            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const a = data[i + 3];

                if (a === 0) continue; 

                // Distancia euclidiana del color respecto al target (ej. Negro)
                const dist = Math.sqrt(Math.pow(r - targetR, 2) + Math.pow(g - targetG, 2) + Math.pow(b - targetB, 2));

                if (dist <= tolerance) {
                    data[i + 3] = 0; // Transparencia absoluta para colores exactos
                } else if (dist <= tolerance + smoothing) {
                    // Transición Alpha suave para bordes y destellos de luz (Lightmaps)
                    const alphaFactor = (dist - tolerance) / smoothing;
                    data[i + 3] = Math.floor(a * alphaFactor);
                }
            }

            ctx.putImageData(imgData, 0, 0);
            
            source.image = canvas;
            source.isCanvas = true;
            source.update(); // Obliga a WebGL a refrescar la textura Alpha
        });
        
        tex.customChromaKeyApplied = true;
    }

    applyBlendMode(gameObject, blendModeString) {
        if (!blendModeString || typeof blendModeString !== 'string') return;
        if (funkin.play && funkin.play.BlendMode) {
            funkin.play.BlendMode.apply(gameObject, blendModeString);
        }
    }
}

funkin.play = funkin.play || {};
funkin.play.uiSkins = new PlayUISkins();