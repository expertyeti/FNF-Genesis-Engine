/**
 * @file getCharts.js
 * Sistema para cargar y procesar los charts (archivos JSON de las canciones).
 */
class ChartManager {
  constructor() {
    this.chartData = null; 
  }

  async loadChart(playData) {
    if (!playData || !playData.actuallyPlaying) {
      console.error("Datos inválidos para cargar el chart");
      return false;
    }

    const songName = playData.actuallyPlaying;
    const difficulty = (playData.difficulty || "normal").toLowerCase();

    let fileName = `${songName}-${difficulty}.json`;
    if (difficulty === "normal") {
      fileName = `${songName}.json`;
    }

    const url = `${window.BASE_URL}assets/songs/${songName}/charts/${fileName}`;

    try {
      console.log(`Cargando chart desde ${url}`);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP status ${response.status}`);
      }

      this.chartData = await response.json();

      console.log("Chart cargado con éxito");
      return true;
    } catch (error) {
      console.error(`Error crítico cargando chart en ${url}`, error);
      this.chartData = null;
      return false;
    }
  }

  get(path) {
    if (!this.chartData) {
      console.warn("Intento de acceso al chart antes de ser cargado");
      return null;
    }

    if (!path) return this.chartData;

    const keys = path.split(".");
    let current = this.chartData;

    for (const key of keys) {
      if (current === undefined || current === null) {
        return undefined;
      }
      current = current[key];
    }

    return current;
  }

  setScrollSpeed(speed) {
    if (!this.chartData) {
      console.warn("No hay chart cargado para cambiar la velocidad");
      return;
    }
    if (!this.chartData.metadata) {
      this.chartData.metadata = {};
    }

    this.chartData.metadata.speed = speed;
    console.log(`Velocidad del chart modificada a ${speed}`);
  }

  injectNote(time, direction, isPlayer, type = "normal") {
    if (!this.chartData) {
      console.warn("No hay chart cargado para inyectar nota");
      return;
    }

    if (!this.chartData.notes) {
      this.chartData.notes = [];
    }

    const pValue = isPlayer ? 1 : 0; 

    const newNote = {
      t: time,
      d: direction,
      p: pValue,
      l: 0,
      k: type,
    };

    this.chartData.notes.push(newNote);
    this.chartData.notes.sort((a, b) => a.t - b.t);

    if (funkin.play.visuals && funkin.play.visuals.arrows && funkin.play.visuals.arrows.notes && typeof funkin.play.visuals.arrows.notes.emit === "function") {
      funkin.play.visuals.arrows.notes.emit("inject_note", newNote);
    }
  }
}

funkin.play.data.sources.ChartManager = ChartManager;

// Instancia global usada por PhaseInit
funkin.play.chart = new ChartManager();