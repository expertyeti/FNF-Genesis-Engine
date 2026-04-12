/**
 * @file getCharacters.js
 * Descarga e inicializa la data de los personajes desde el JSON del mapa.
 */
class CharacterDataLoader {
    constructor() {
        this.charactersData = {
            opponents: [],
            players: [],
            spectator: []
        };
    }

    async loadCharacters() {
        if (!funkin.play.chart) {
            console.error("[Genesis Engine] funkin.play.chart no está inicializado.");
            return null;
        }

        let metadata = funkin.play.chart.get('metadata');
        if (!metadata) return null;

        // 1. PREVENCIÓN: Si el .jsonc se guardó como string en caché, lo parseamos a fuerza bruta
        if (typeof metadata === 'string') {
            try {
                // Elimina los comentarios del formato JSONC para evitar errores de parseo
                const cleanJson = metadata.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
                metadata = JSON.parse(cleanJson);
                console.log("[getCharacters] El metadata era un string. Parseado con éxito.");
            } catch(e) {
                console.error("[getCharacters] Falló el parseo forzado del JSONC:", e);
            }
        }

        console.log("[getCharacters] Objeto metadata recuperado:", metadata);

        let opponents = [];
        let players = [];
        let spectators = [];

        // 2. BÚSQUEDA ROBUSTA DE LA ESTRUCTURA
        if (metadata.base && metadata.base.characters) {
            console.log("[getCharacters] -> Ruta detectada: metadata.base.characters");
            opponents = metadata.base.characters.opponents || [];
            players = metadata.base.characters.players || [];
            spectators = metadata.base.characters.spectator || [];
        } else if (metadata.characters) {
            // Por si el objeto recuperado ya es la raíz 'base'
            console.log("[getCharacters] -> Ruta detectada: metadata.characters directa");
            opponents = metadata.characters.opponents || [];
            players = metadata.characters.players || [];
            spectators = metadata.characters.spectator || [];
        } else {
            console.log("[getCharacters] -> Ruta detectada: Fallback (Estructura antigua)");
            opponents = metadata.opponents || [];
            players = metadata.players || [];
            spectators = metadata.spectator || [];
        }

        console.log(`[getCharacters] Arrays listos para descargar -> Jugadores: [${players}], Oponentes: [${opponents}], Espectadores: [${spectators}]`);

        if (players.length === 0 && opponents.length === 0 && spectators.length === 0) {
            console.warn("[getCharacters] ¡ALERTA! No se encontró a nadie en el JSON. Revisa el objeto impreso arriba.");
        }

        try {
            const fetchCharacterGroup = async (characterArray) => {
                if (!Array.isArray(characterArray)) return [];
                const promises = characterArray.map(async (charName) => {
                    return await this.loadDynamicCharacter(charName);
                });
                return Promise.all(promises);
            };

            const [opponentsData, playersData, spectatorsData] = await Promise.all([
                fetchCharacterGroup(opponents),
                fetchCharacterGroup(players),
                fetchCharacterGroup(spectators)
            ]);

            // Se filtran los nulos (archivos que dieron error 404)
            this.charactersData.opponents = opponentsData.filter(Boolean);
            this.charactersData.players = playersData.filter(Boolean);
            this.charactersData.spectator = spectatorsData.filter(Boolean);

            if (funkin.play.characters) {
                funkin.play.characters.charactersData = this.charactersData;
            }

            console.log("¡JSON de personajes descargados con éxito!\n", this.charactersData);
            return this.charactersData;

        } catch (error) {
            console.error("[getCharacters] Error crítico al cargar los personajes:", error);
            return null;
        }
    }

    async loadDynamicCharacter(charName) {
        if (!charName) return null;
        
        const url = `${window.BASE_URL}assets/data/characters/${charName}.json`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                // Si la consola imprime este mensaje, significa que el arreglo funciona, pero no encuentra el archivo .json de BF o PICO en la carpeta
                console.warn(`[getCharacters] Error HTTP ${response.status}: No se encontró el archivo del personaje en ${url}`);
                return null;
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`[getCharacters] Error de red al intentar descargar '${charName}':`, error);
            return null;
        }
    }
}

funkin.play.data.sources.CharacterDataLoader = CharacterDataLoader;

// Instancia global usada por PhaseInit
funkin.play.characterLoader = new CharacterDataLoader();
funkin.getCharacters = funkin.play.characterLoader;