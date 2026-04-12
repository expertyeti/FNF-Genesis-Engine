/**
 * @file src/funkin/play/data/playScene/getSources/getCharts.js
 * Sistema para cargar y procesar los charts (archivos JSON limpios de las canciones).
 */
class ChartManager {
  constructor() {
    this.chartData = null; 
  }

  _mergeMetadata(base, override) {
    if (!override) return { ...base };
    const result = { ...base };
    
    for (const key in override) {
      if (override[key] !== null && typeof override[key] === 'object' && !Array.isArray(override[key])) {
        result[key] = this._mergeMetadata(result[key] || {}, override[key]);
      } else {
        result[key] = override[key]; 
      }
    }
    return result;
  }

  async loadChart(playData) {
    if (!playData || !playData.actuallyPlaying) {
      console.error("Datos inválidos para cargar el chart");
      return false;
    }

    const songName = playData.actuallyPlaying.toLowerCase();
    const difficulty = (playData.difficulty || "normal").toLowerCase();

    const baseUrl = `${window.BASE_URL || ''}assets/songs/${songName}/charts/`;
    // Actualizado para apuntar a extensiones .json estándar
    const metaUrl = `${baseUrl}meta.json`;
    const notesUrl = `${baseUrl}notes.json`;

    try {
      const [metaResponse, notesResponse] = await Promise.all([
        fetch(metaUrl),
        fetch(notesUrl)
      ]);

      if (!metaResponse.ok) throw new Error(`HTTP status ${metaResponse.status} al cargar meta.json`);
      if (!notesResponse.ok) throw new Error(`HTTP status ${notesResponse.status} al cargar notes.json`);

      // Al ser JSON limpio, usamos directamente el parser nativo de la respuesta fetch
      const metaData = await metaResponse.json();
      const notesData = await notesResponse.json();

      const baseMeta = metaData.base || {};
      const diffMeta = (metaData.difficulties && metaData.difficulties[difficulty]) ? metaData.difficulties[difficulty] : {};

      const finalMetadata = this._mergeMetadata(baseMeta, diffMeta);

      this.chartData = {
        metadata: {
          ...finalMetadata,
          mania: finalMetadata.lanes || 4 
        },
        notes: notesData[difficulty] || []
      };

      return true;
    } catch (error) {
      console.error(`Error crítico cargando chart en ${baseUrl}`, error);
      this.chartData = null;
      return false;
    }
  }

  get(path) {
    if (!this.chartData) return null;
    if (!path) return this.chartData;

    const keys = path.split(".");
    let current = this.chartData;

    for (const key of keys) {
      if (current === undefined || current === null) return undefined;
      current = current[key];
    }
    return current;
  }

  setScrollSpeed(speed) {
    if (!this.chartData) return;
    if (!this.chartData.metadata) this.chartData.metadata = {};
    this.chartData.metadata.scrollSpeed = speed; 
  }

  injectNote(time, direction, isPlayer) {
    if (!this.chartData) return;
    if (!this.chartData.notes) this.chartData.notes = [];

    // Se asigna string (pl u op) en lugar de número, y se elimina 'k'
    const pValue = isPlayer ? "pl" : "op"; 

    const newNote = {
      t: time,
      d: direction,
      p: pValue,
      l: 0
    };

    this.chartData.notes.push(newNote);
    this.chartData.notes.sort((a, b) => a.t - b.t);

    if (funkin.play.visuals && funkin.play.visuals.arrows && funkin.play.visuals.arrows.notes && typeof funkin.play.visuals.arrows.notes.emit === "function") {
      funkin.play.visuals.arrows.notes.emit("inject_note", newNote);
    }
  }
}

funkin.play.data.sources.ChartManager = ChartManager;
funkin.play.chart = new ChartManager();