/**
 * @file preloadCharacters.js
 * Gestiona la precarga de texturas, XML y los iconos de la barra de vida
 * para los personajes obtenidos de la partida.
 */
class PreloadCharacters {
  static loadedKeys = {
    opponents: [],
    players: [],
    spectator: [],
  };

  static preload(scene) {
    if (funkin.play.options && funkin.play.options.simpleMode === true) {
      console.log(
        "Saltando carga de texturas y sprites de personajes por modo simple.",
      );
      this.loadedKeys = { opponents: [], players: [], spectator: [] };
      return;
    }

    // Validación estricta para asegurar que el character loader existe 
    // y evitar los errores en la fase Init (PhaseInit.js).
    if (!funkin.play.characterLoader || !funkin.play.characterLoader.charactersData) {
      console.warn("No se encontró data de personajes (characterLoader es null). Saltando precarga de personajes.");
      this.loadedKeys = { opponents: [], players: [], spectator: [] };
      return;
    }

    const charsData = funkin.play.characterLoader.charactersData;

    this.loadedKeys = {
      opponents: [],
      players: [],
      spectator: [],
    };

    const loadGroup = (group, groupName) => {
      if (!group || group.length === 0) return;

      group.forEach((char, index) => {
        if (char && char.image) {
          const charType = char.type || "sparrow";

          const imagePath = `${window.BASE_URL}assets/images/${char.image}.png`;
          const xmlPath = `${window.BASE_URL}assets/images/${char.image}.xml`;

          scene.load.image(char.image, imagePath);
          scene.load.text(`${char.image}_xml`, xmlPath);

          let iconId = "face";
          if (char.health && char.health.id) {
            iconId = char.health.id;
          }

          const iconKey = `icon_${iconId}`;
          const iconPath = `${window.BASE_URL}assets/images/icons/${iconId}.png`;
          scene.load.image(iconKey, iconPath);

          this.loadedKeys[groupName].push({
            id: `${groupName}_${index}`,
            key: char.image,
            type: charType,
            data: char,
          });

          console.log(
            `Encolado personaje ${char.image} para el grupo ${groupName}`,
          );
        }
      });
    };

    loadGroup(charsData.opponents, "opponents");
    loadGroup(charsData.players, "players");
    loadGroup(charsData.spectator, "spectator");
  }
}

funkin.play.data.sources.PreloadCharacters = PreloadCharacters;

// Alias requerido por PhaseInit
funkin.play.preload = funkin.play.preload || {};
funkin.play.preload.characters = PreloadCharacters;