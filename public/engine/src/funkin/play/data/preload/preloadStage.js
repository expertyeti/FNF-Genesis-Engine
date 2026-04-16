/**
 * @file preloadStage.js
 * Optimizado: Removida la carga síncrona manual. Pura encolación.
 */
class PreloadStage {
    static async preload(scene, stageName) {
        scene.load.imageBitmapFormat = true;

        if (funkin.play.options?.simpleMode) return;

        const data = funkin.play.stageManager?.get();
        if (!data?.stage || !Array.isArray(data.stage)) return;

        const pathName = data.pathName || stageName;
        const baseUrl = window.BASE_URL || "";

        if (typeof data.background === "string" && !data.background.startsWith("#")) {
            const bgKey = `bg_${pathName}`;
            if (!scene.textures.exists(bgKey)) {
                scene.load.image(bgKey, `${baseUrl}assets/images/stages/${pathName}/${data.background}.png`);
            }
        }

        for (const item of data.stage) {
            if ((item.type === 'image' || item.type === 'spritesheet') && item.namePath) {
                const cleanPath = item.namePath.endsWith("/") ? item.namePath.slice(0, -1) : item.namePath;
                const key = item.image || item.name || (cleanPath ? `stage_${pathName}_${cleanPath}` : `stage_${pathName}`);
                
                const basePath = cleanPath.includes('/') 
                    ? `${baseUrl}assets/images/stages/${cleanPath}` 
                    : `${baseUrl}assets/images/stages/${pathName}/${cleanPath}`;

                if (item.type === "image" && !scene.textures.exists(key)) {
                    scene.load.image(key, `${basePath}.png`);
                } else if (item.type === "spritesheet" && !scene.textures.exists(key)) {
                    scene.load.atlasXML(key, `${basePath}.png`, `${basePath}.xml`);
                    scene.load.text(`${key}_rawXML`, `${basePath}.xml`);
                }
            }
        }
    }
}

funkin.play.data.sources.PreloadStage = PreloadStage;
funkin.play.PreloadStage = PreloadStage;