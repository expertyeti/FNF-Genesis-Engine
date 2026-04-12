/**
 * @file preloadStage.js
 * Se encarga de precargar los recursos gráficos del escenario.
 */
class PreloadStage {
  static async preload(scene, stageName) {
    return new Promise((resolve) => {
      scene.load.imageBitmapFormat = true;

      if (funkin.play.options && funkin.play.options.simpleMode === true) {
        return resolve();
      }

      const data = funkin.play.stageManager.get();
      if (!data || !data.stage || !Array.isArray(data.stage)) return resolve();

      const pathName = data.pathName || stageName;
      let assetsToLoad = 0;

      if (data.background && typeof data.background === "string" && !data.background.startsWith("#")) {
        const bgKey = `bg_${pathName}`;
        if (!scene.textures.exists(bgKey)) {
          scene.load.image(bgKey, `${window.BASE_URL}assets/images/stages/${pathName}/${data.background}.png`);
          assetsToLoad++;
        }
      }

      data.stage.forEach((item) => {
        // Precargar texturas normales y spritesheets
        if (item.type === 'image' || item.type === 'spritesheet') {
            if (item.namePath) {
              const cleanPath = item.namePath.endsWith("/") ? item.namePath.slice(0, -1) : item.namePath;
              const key = item.image || item.name || (cleanPath ? `stage_${pathName}_${cleanPath}` : `stage_${pathName}`);
              
              // Se asegura de que siempre busque dentro de la carpeta stages/
              const basePath = cleanPath.includes('/') 
                ? `${window.BASE_URL}assets/images/stages/${cleanPath}` 
                : `${window.BASE_URL}assets/images/stages/${pathName}/${cleanPath}`;

              if (item.type === "image" && !scene.textures.exists(key)) {
                scene.load.image(key, `${basePath}.png`);
                assetsToLoad++;
              } else if (item.type === "spritesheet" && !scene.textures.exists(key)) {
                scene.load.atlasXML(key, `${basePath}.png`, `${basePath}.xml`);
                scene.load.text(`${key}_rawXML`, `${basePath}.xml`);
                assetsToLoad += 2;
              }
            }
        }
      });

      if (assetsToLoad === 0) return resolve();

      scene.load.once("complete", () => {
        resolve();
      });

      scene.load.start();
    });
  }
}

funkin.play.data.sources.PreloadStage = PreloadStage;
funkin.play.PreloadStage = PreloadStage;