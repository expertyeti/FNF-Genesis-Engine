/**
 * @file getStages.js
 * Descarga y almacena los datos JSON del escenario (Stage) actual.
 * Provee métodos para extraer propiedades de los personajes fácilmente.
 */
class StageManager {
    constructor() {
        this.stageData = null;
        this.stageName = null;
    }

    async loadStage(stageName) {
        this.stageName = stageName || 'stage';
        const url = `${window.BASE_URL || ''}assets/data/stages/${this.stageName}.json`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            this.stageData = await response.json();
            console.log(`[StageManager] Stage "${this.stageName}" cargado correctamente vía fetch.`);
        } catch (error) {
            console.warn(`[StageManager] No se pudo cargar el JSON del escenario en ${url}. Se usará un escenario vacío.`, error);
            this.stageData = { stage: [] };
        }

        return this.stageData;
    }

    get() {
        return this.stageData;
    }

    /**
     * Busca y retorna los datos del personaje dentro del JSON del Stage actual.
     * @param {string} role "player", "opponent" o "spectator"
     * @returns {Object|null} El objeto con position, scale, layer, camera_Offset, etc.
     */
    getCharacterData(role) {
        if (!this.stageData) return null;

        // Llaves de busqueda para encontrar el rol correcto
        const searchKeys = role === "opponent" ? ["opponent", "enemy", "dad"] : 
                           role === "spectator" ? ["spectator", "playergf", "gf", "girlfriend"] : 
                           ["player", "bf", "boyfriend"];

        // Buscar en la propiedad 'stage' o 'characters'
        const dataToSearch = this.stageData.stage || this.stageData.characters || [];

        if (Array.isArray(dataToSearch)) {
            for (let item of dataToSearch) {
                for (let key of searchKeys) {
                    if (item[key]) return item[key];
                }
            }
        } else {
            for (let key of searchKeys) {
                if (dataToSearch[key]) return dataToSearch[key];
            }
        }

        return null;
    }
}

funkin.play.data.sources.StageManager = StageManager;

// Instancia global usada por PhaseInit
funkin.play.stageManager = new StageManager();