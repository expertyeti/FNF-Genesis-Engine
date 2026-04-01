/**
 * @file src/funkin/play/visuals/skins/SkinPathResolver.js
 * Módulo de procesamiento de rutas. Resuelve la notación de puntos (dot notation)
 * y genera las llaves correctas para la caché de Phaser.
 */

class SkinPathResolver {
    static isValidPath(pathStr) {
        return typeof pathStr === 'string' && pathStr.trim() !== "" && !pathStr.trim().endsWith("/");
    }

    static getAssetKey(originalPath, skinData) {
        if (!this.isValidPath(originalPath)) return null;
        
        const mainPath = (skinData && skinData.global && skinData.global.basePath) ? skinData.global.basePath : "Funkin";
        
        if (funkin.play && funkin.play.session) {
            return funkin.play.session.getKey(`skin_${mainPath}_${originalPath}`);
        }
        
        return `skin_${mainPath}_${originalPath}`;
    }

    static resolveFromData(data, keysArray) {
        if (!data) return undefined;
        
        let current = data;
        for (const key of keysArray) {
            if (current === undefined || current === null) return undefined;
            current = current[key];
        }
        
        if (typeof current === 'string' && (current.trim() === "" || current.trim().endsWith("/"))) {
            return undefined;
        }
        
        return current;
    }

    static get(skinData, fallbackSkinData, pathStr) {
        if (!skinData && !fallbackSkinData) return null;
        if (!pathStr || pathStr.toLowerCase() === 'all') return skinData || fallbackSkinData;

        const tryPaths = [pathStr];
        if (pathStr.startsWith("bars.")) tryPaths.push("ui." + pathStr);
        if (pathStr.startsWith("ui.bars.")) tryPaths.push(pathStr.replace("ui.", ""));

        for (const p of tryPaths) {
            let result = this.resolveFromData(skinData, p.split('.'));
            if (result !== undefined) return result;
        }

        for (const p of tryPaths) {
            let result = this.resolveFromData(fallbackSkinData, p.split('.'));
            if (result !== undefined) return result;
        }

        return undefined;
    }
}

funkin.play = funkin.play || {};
funkin.play.SkinPathResolver = SkinPathResolver;