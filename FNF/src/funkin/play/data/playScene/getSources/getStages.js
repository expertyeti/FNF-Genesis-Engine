/**
 * @file src/funkin/play/data/playScene/getSources/getStages.js
 * Descarga y almacena los datos JSON del escenario actual.
 */

class StageManager {
    constructor() {
        this.stageData = null;
        this.stageName = null;
    }

    async loadStage(stageName) {
        this.stageName = stageName || 'stage';
        const url = `public/data/stages/${this.stageName}.json`;

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

funkin.play = funkin.play || {};
funkin.play.stageManager = new StageManager();