/**
 * @file getStages.js
 * Descarga y almacena los datos JSON del escenario (Stage) actual.
 */
class StageManager {
    constructor() {
        this.stageData = null;
        this.stageName = null;
    }

    async loadStage(stageName) {
        this.stageName = stageName || 'stage';
        const url = `${window.BASE_URL}assets/data/stages/${this.stageName}.json`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            this.stageData = await response.json();
        } catch (error) {
            console.warn(`No se pudo cargar el JSON del escenario en ${url}. Se usará un escenario vacío.`, error);
            this.stageData = { stage: [] };
        }

        return this.stageData;
    }

    get() {
        return this.stageData;
    }
}

funkin.play.data.sources.StageManager = StageManager;

// Instancia global usada por PhaseInit
funkin.play.stageManager = new StageManager();