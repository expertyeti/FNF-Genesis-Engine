/**
 * @file preloadCharacters.js
 * Optimizado: Detecta extensiones personalizadas (.webp, .png) tanto en la imagen principal 
 * como en las animaciones. Usa .png por defecto. Se limpia al iniciar nueva carga.
 * Modificado: Precarga de Boyfriend en formato .webp para el Fallback de Muerte.
 */
class PreloadCharacters {
    static loadedKeys = { opponents: [], players: [], spectator: [] };

    static async preload(scene) {
        // SIEMPRE reiniciar las llaves para evitar acumular personajes de canciones pasadas
        this.loadedKeys = { opponents: [], players: [], spectator: [] };

        const baseUrl = window.BASE_URL || "";

        // --- CORRECCIÓN: PRECARGA OBLIGATORIA DE BF EN .WEBP PARA EL FALLBACK ---
        const fallbackKey = 'characters/BOYFRIEND';
        const fallbackExt = '.webp'; // ¡Aquí estaba el error! Ahora usa .webp

        if (!scene.textures.exists(fallbackKey)) {
            scene.load.image(fallbackKey, `${baseUrl}assets/images/${fallbackKey}${fallbackExt}`);
            scene.load.text(`${fallbackKey}_xml`, `${baseUrl}assets/images/${fallbackKey}.xml`);
        }
        // -----------------------------------------------------------------------

        if (funkin.play.options?.simpleMode) {
            return;
        }

        if (!funkin.play.characterLoader?.charactersData) {
            return;
        }

        const charsData = funkin.play.characterLoader.charactersData;
        
        const loadGroup = (group, groupName) => {
            if (!group) return;

            for (let index = 0; index < group.length; index++) {
                const char = group[index];
                if (!char?.image) continue;

                // Detectar extensión desde el JSON (ej. "characters/BOYFRIEND.webp")
                let rawImage = char.image;
                let mainExtIndex = rawImage.lastIndexOf('.');
                let mainKey = rawImage;
                let mainExt = '.png'; // POR DEFECTO
                
                if (mainExtIndex !== -1 && (rawImage.length - mainExtIndex <= 5)) {
                    mainKey = rawImage.substring(0, mainExtIndex);
                    mainExt = rawImage.substring(mainExtIndex);
                }

                const imagePath = `${baseUrl}assets/images/${mainKey}${mainExt}`;
                const xmlPath = `${baseUrl}assets/images/${mainKey}.xml`;
                
                const iconId = char.health?.id || "face";
                const iconKey = `icon_${iconId}`;
                const iconPath = `${baseUrl}assets/images/icons/${iconId}.png`;

                if (!scene.textures.exists(mainKey)) {
                    scene.load.image(mainKey, imagePath);
                    scene.load.text(`${mainKey}_xml`, xmlPath);
                }
                
                if (!scene.textures.exists(iconKey)) {
                    scene.load.image(iconKey, iconPath);
                }

                if (char.animations && Array.isArray(char.animations)) {
                    char.animations.forEach(anim => {
                        if (anim.path) {
                            let extIndex = anim.path.lastIndexOf('.');
                            let customKey = anim.path;
                            let ext = '.png'; 
                            
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
                    key: mainKey, // Guardamos la llave limpia sin extensión
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