/**
 * @file preloadCharacters.js
 * Optimizado: Solo encola assets, sin bloquear el hilo.
 */
class PreloadCharacters {
    static loadedKeys = { opponents: [], players: [], spectator: [] };

    static async preload(scene) {
        if (funkin.play.options?.simpleMode) {
            this.loadedKeys = { opponents: [], players: [], spectator: [] };
            return;
        }

        if (!funkin.play.characterLoader?.charactersData) {
            this.loadedKeys = { opponents: [], players: [], spectator: [] };
            return;
        }

        const charsData = funkin.play.characterLoader.charactersData;
        const baseUrl = window.BASE_URL || "";

        const loadGroup = (group, groupName) => {
            if (!group) return;

            for (let index = 0; index < group.length; index++) {
                const char = group[index];
                if (!char?.image) continue;

                const imagePath = `${baseUrl}assets/images/${char.image}.png`;
                const xmlPath = `${baseUrl}assets/images/${char.image}.xml`;
                const iconId = char.health?.id || "face";
                const iconKey = `icon_${iconId}`;
                const iconPath = `${baseUrl}assets/images/icons/${iconId}.png`;

                // Encolar a Phaser
                if (!scene.textures.exists(char.image)) {
                    scene.load.image(char.image, imagePath);
                    scene.load.text(`${char.image}_xml`, xmlPath);
                }
                
                if (!scene.textures.exists(iconKey)) {
                    scene.load.image(iconKey, iconPath);
                }

                this.loadedKeys[groupName].push({
                    id: `${groupName}_${index}`,
                    key: char.image,
                    type: char.type || "sparrow",
                    data: char,
                });
            }
        };

        loadGroup(charsData.opponents, "opponents");
        loadGroup(charsData.players, "players");
        loadGroup(charsData.spectator, "spectator");
    }
}

funkin.play.data.sources.PreloadCharacters = PreloadCharacters;
funkin.play.preload = funkin.play.preload || {};
funkin.play.preload.characters = PreloadCharacters;