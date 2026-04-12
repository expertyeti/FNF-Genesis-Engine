/**
 * @file StoryModeData.js
 * Carga y gestiona los datos de las semanas y dificultades del modo historia.
 */
class StoryModeData {
  constructor() {
    this.weeks = [];
    this.weekKeys = [];
    this.difficulties = ["easy", "normal", "hard"];
    this.selectedWeekIndex = 0;
    this.selectedDifficulty = 1;
  }

  /**
   * @param {Phaser.Scene} scene - La escena actual para precargar assets.
   * @returns {Promise<void>} Promesa que se resuelve al terminar la carga.
   */
  async loadWeeksData(scene) {
    this.weeks = [];
    this.weekKeys = [];
    const assetsToLoad = [];

    try {
      const response = await fetch(
        `${window.BASE_URL}assets/data/ui/weeks.txt?t=${Date.now()}`,
      );
      if (!response.ok) throw new Error("No se pudo cargar weeks.txt");

      const text = await response.text();
      const weekIds = text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      for (const weekId of weekIds) {
        try {
          const jsonRes = await fetch(
            `${window.BASE_URL}assets/data/weeks/${weekId}.json?t=${Date.now()}`,
          );
          if (!jsonRes.ok) continue;

          let json = await jsonRes.json();
          if (json.visible === false) continue;

          // Extraer nombres reales de las canciones desde el meta.json
          const rawTracks = json.tracks || json.songs || [];
          const trackPromises = rawTracks.map(async (trackEntry) => {
             let folderName = typeof trackEntry === 'string' ? trackEntry : (Array.isArray(trackEntry) ? trackEntry[0] : "");
             if (!folderName) return "???";

             try {
                 // Accedemos al meta.json limpio para sacar el songName
                 const metaRes = await fetch(`${window.BASE_URL}assets/songs/${folderName.toLowerCase()}/charts/meta.json`);
                 if (metaRes.ok) {
                     const metaJson = await metaRes.json();
                     return metaJson.songName || folderName;
                 }
                 return folderName;
             } catch (e) {
                 return folderName;
             }
          });

          // Esperamos todas las llamadas de la semana y lo guardamos
          json.resolvedTrackNames = await Promise.all(trackPromises);

          const weekTitle = json.weekTitle || weekId;

          this.weeks.push({ id: weekId, titleImage: weekTitle, data: json });
          this.weekKeys.push(weekId);

          if (!scene.textures.exists(weekTitle)) {
            assetsToLoad.push({
              type: "image",
              key: weekTitle,
              url: `${window.BASE_URL}assets/images/menu/storymode/titles/${weekTitle}.png`,
            });
          }

          if (json.weekBackground && typeof json.weekBackground === "string") {
            const bgVal = json.weekBackground.trim();
            if (
              bgVal !== "" &&
              !bgVal.startsWith("#") &&
              !scene.textures.exists(bgVal)
            ) {
              assetsToLoad.push({
                type: "image",
                key: bgVal,
                url: `${window.BASE_URL}assets/images/menu/storymode/backgrounds/${bgVal}.png`,
              });
            }
          }

          if (
            json.weekCharacters &&
            typeof json.weekCharacters === "object" &&
            !Array.isArray(json.weekCharacters)
          ) {
            Object.keys(json.weekCharacters).forEach((charKey) => {
              const charData = json.weekCharacters[charKey];
              const pathName =
                charData.path && charData.path.trim() !== ""
                  ? charData.path
                  : charKey;
              const texKey = `menu_char_${pathName}`;

              if (!scene.textures.exists(texKey)) {
                assetsToLoad.push({
                  type: "atlas",
                  key: texKey,
                  png: `${window.BASE_URL}assets/images/menu/storymode/menucharacters/Menu_${pathName}.png`,
                  xml: `${window.BASE_URL}assets/images/menu/storymode/menucharacters/Menu_${pathName}.xml`,
                });
                assetsToLoad.push({
                  type: "text",
                  key: texKey + "_xml_data",
                  url: `${window.BASE_URL}assets/images/menu/storymode/menucharacters/Menu_${pathName}.xml`,
                });
              }
            });
          }
        } catch (e) {
          console.warn(`[StoryModeData] Error cargando ${weekId}:`, e);
        }
      }

      if (this.selectedWeekIndex >= this.weeks.length)
        this.selectedWeekIndex = 0;

      if (assetsToLoad.length > 0) {
        return new Promise((resolve) => {
          let hasStarted = false;
          assetsToLoad.forEach((asset) => {
            if (asset.type === "image") scene.load.image(asset.key, asset.url);
            if (asset.type === "atlas")
              scene.load.atlasXML(asset.key, asset.png, asset.xml);
            if (asset.type === "text") scene.load.text(asset.key, asset.url);
            hasStarted = true;
          });

          if (hasStarted) {
            scene.load.once("complete", () => {
              assetsToLoad.forEach((asset) => {
                if (asset.type === "atlas") {
                  const texKey = asset.key;
                  const xmlText = scene.cache.text.get(texKey + "_xml_data");

                  // APLICAMOS NUESTRO NUEVO NAMESPACE AQUÍ
                  if (
                    xmlText &&
                    funkin.utils.animations.sparrow.SparrowParser
                  ) {
                    funkin.utils.animations.sparrow.SparrowParser.fixPhaserSparrow(
                      scene,
                      texKey,
                      xmlText,
                    );
                  }
                }
              });
              resolve();
            });
            scene.load.start();
          } else {
            resolve();
          }
        });
      } else {
        return Promise.resolve();
      }
    } catch (error) {
      console.error("[StoryModeData] Error fatal:", error);
      return Promise.resolve();
    }
  }

  changeWeek(direction) {
    if (this.weekKeys.length === 0) return;
    this.selectedWeekIndex =
      (this.selectedWeekIndex + direction + this.weekKeys.length) %
      this.weekKeys.length;
  }

  changeDifficulty(direction) {
    this.selectedDifficulty =
      (this.selectedDifficulty + direction + this.difficulties.length) %
      this.difficulties.length;
  }

  getCurrentWeek() {
    return this.weeks.length > 0 ? this.weeks[this.selectedWeekIndex] : null;
  }

  getCurrentDifficultyName() {
    return this.difficulties[this.selectedDifficulty];
  }
}

funkin.ui.storyMode.StoryModeData = StoryModeData;