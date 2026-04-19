/**
 * @file preloadCharacters.js
 * Optimizado: Encola assets principales y animaciones optimizadas en archivos separados (.png, .webp, etc).
 * Si no se especifica extensión, usa .png por defecto.
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

                // Encolar textura principal del personaje
                if (!scene.textures.exists(char.image)) {
                    scene.load.image(char.image, imagePath);
                    scene.load.text(`${char.image}_xml`, xmlPath);
                }
                
                if (!scene.textures.exists(iconKey)) {
                    scene.load.image(iconKey, iconPath);
                }

                // NUEVO: Buscar animaciones propias (optimizadas) con rutas personalizadas
                if (char.animations && Array.isArray(char.animations)) {
                    char.animations.forEach(anim => {
                        if (anim.path) {
                            let extIndex = anim.path.lastIndexOf('.');
                            let customKey = anim.path;
                            let ext = '.png'; // POR DEFECTO
                            
                            // Verificar si existe una extensión válida al final de la ruta (ej. .webp)
                            if (extIndex !== -1 && (anim.path.length - extIndex <= 5)) {
                                customKey = anim.path.substring(0, extIndex);
                                ext = anim.path.substring(extIndex);
                            }
                            
                            if (!scene.textures.exists(customKey)) {
                                scene.load.image(customKey, `${baseUrl}assets/images/${customKey}${ext}`);
                                scene.load.text(`${customKey}_xml`, `${baseUrl}assets/images/${customKey}.xml`);
                            }
                        }
                    });
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