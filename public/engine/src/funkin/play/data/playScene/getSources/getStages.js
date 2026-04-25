/**
 * @file getStages.js
 * descarga y almacena los datos json del escenario (stage) actual.
 * ahora con fallback automatico a mainstage para evitar escenarios vacios.
 */

window.funkin = window.funkin || {};
window.funkin.play = window.funkin.play || {};
window.funkin.play.data = window.funkin.play.data || {};
window.funkin.play.data.sources = window.funkin.play.data.sources || {};

class StageManager {
  constructor() {
    this.stageData = null;
    this.stageName = null;
  }

  async loadStage(stageName) {
    this.stageName = stageName || "stage";
    const url = `${window.BASE_URL || ""}assets/data/stages/${this.stageName}.json`;
    const fallbackUrl = `${window.BASE_URL || ""}assets/data/stages/mainStage.json`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`error http: ${response.status}`);
      }
      this.stageData = await response.json();
      console.log(`[StageManager] stage "${this.stageName}" cargado correctamente.`);
    } catch (error) {
      if (this.stageName !== "mainStage") {
        console.warn(`[StageManager] no se pudo cargar ${this.stageName}.json. intentando mainStage.json...`);
        try {
          const fallbackRes = await fetch(fallbackUrl);
          if (fallbackRes.ok) {
            this.stageData = await fallbackRes.json();
            return this.stageData;
          }
        } catch (fallbackError) {
          console.error("[StageManager] error critico con el mainStage", fallbackError);
        }
      }

      console.warn(`[StageManager] se usara un escenario vacio.`, error);
      this.stageData = { stage: [] };
    }

    return this.stageData;
  }

  get() {
    return this.stageData;
  }

  getCharacterData(role) {
    if (!this.stageData) return null;

    const searchKeys =
      role === "opponent"
        ? ["opponent", "enemy", "dad"]
        : role === "spectator"
          ? ["spectator", "playergf", "gf", "girlfriend"]
          : ["player", "bf", "boyfriend"];

    const dataToSearch =
      this.stageData.stage || this.stageData.characters || [];

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

// instancia global usada por phaseinit
funkin.play.stageManager = new StageManager();