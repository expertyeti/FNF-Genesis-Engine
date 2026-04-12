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

        const metadata = funkin.play.chart.get('metadata');
        if (!metadata) return null;

        const opponents = metadata.opponents || [];
        const players = metadata.players || [];
        const spectators = metadata.spectator || [];

        try {
            const fetchCharacterGroup = async (characterArray) => {
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

            this.charactersData.opponents = opponentsData.filter(Boolean);
            this.charactersData.players = playersData.filter(Boolean);
            this.charactersData.spectator = spectatorsData.filter(Boolean);

            if (funkin.play.characters) {
                funkin.play.characters.charactersData = this.charactersData;
            }

            console.log("¡JSON de personajes descargados con éxito!\n", this.charactersData);
            return this.charactersData;

        } catch (error) {
            console.error("Error crítico al cargar los personajes:", error);
            return null;
        }
    }

    async loadDynamicCharacter(charName) {
        const url = `${window.BASE_URL}assets/data/characters/${charName}.json`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Status HTTP: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`Error al cargar personaje dinámico '${charName}':`, error);
            return null;
        }
    }
}

funkin.play.data.sources.CharacterDataLoader = CharacterDataLoader;

// Instancia global usada por PhaseInit
funkin.play.characterLoader = new CharacterDataLoader();
funkin.getCharacters = funkin.play.characterLoader;