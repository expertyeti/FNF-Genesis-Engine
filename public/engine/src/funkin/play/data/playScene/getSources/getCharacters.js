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

        // 1. Limpiamos los datos anteriores por si es un reinicio o cambio de canción
        this.charactersData = { opponents: [], players: [], spectator: [] };

        let opponents = [];
        let players = [];
        let spectators = [];

        // 2. BÚSQUEDA ROBUSTA DE LA ESTRUCTURA (Soporta aplanamiento de dificultades)
        const chart = funkin.play.chart;
        if (chart && typeof chart.get === 'function') {
            opponents = chart.get('characters.opponents') || 
                        chart.get('metadata.characters.opponents') || 
                        chart.get('base.characters.opponents') || [];
                        
            players = chart.get('characters.players') || 
                      chart.get('metadata.characters.players') || 
                      chart.get('base.characters.players') || [];
                      
            spectators = chart.get('characters.spectator') || 
                         chart.get('characters.spectators') || 
                         chart.get('metadata.characters.spectator') || 
                         chart.get('base.characters.spectator') || [];
        }

        // Fallback por si el método get() falla (lee el objeto en bruto)
        if (opponents.length === 0 && players.length === 0 && spectators.length === 0) {
            let meta = chart?.metadata || chart?.base || chart;
            if (meta?.characters) {
                opponents = meta.characters.opponents || [];
                players = meta.characters.players || [];
                spectators = meta.characters.spectator || meta.characters.spectators || [];
            }
        }

        console.log(`[getCharacters] Arrays listos para descargar -> Jugadores: [${players}], Oponentes: [${opponents}], Espectadores: [${spectators}]`);

        if (players.length === 0 && opponents.length === 0 && spectators.length === 0) {
            console.warn("[getCharacters] ¡ALERTA! No se encontró a nadie en el JSON. Revisa la estructura del Chart.");
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