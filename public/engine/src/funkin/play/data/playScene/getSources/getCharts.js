/**
 * @file src/funkin/play/data/playScene/getSources/getCharts.js
 * @description Sistema para cargar y procesar los charts (metadatos, notas y eventos).
 * Modificado para soportar variantes de eventos específicas por dificultad.
 */
class ChartManager {
  constructor() {
    this.chartData = null; 
  }

  /**
   * @description Fusiona los metadatos base con los específicos de la dificultad.
   * @private
   */
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

  /**
   * @description Carga todos los JSONs de la canción (meta, notas, eventos).
   * @param {object} playData - Información de la partida (canción, dificultad, etc.).
   */
  async loadChart(playData) {
    if (!playData || !playData.actuallyPlaying) {
      console.error("[ChartManager] Datos inválidos para cargar el chart");
      return false;
    }

    const songName = playData.actuallyPlaying.toLowerCase();
    const difficulty = (playData.difficulty || "normal").toLowerCase();

    const baseUrl = `${window.BASE_URL || ''}assets/songs/${songName}/charts/`;
    const metaUrl = `${baseUrl}meta.json`;
    const notesUrl = `${baseUrl}notes.json`;
    const eventsUrl = `${baseUrl}events.json`; 

    try {
      const [metaResponse, notesResponse] = await Promise.all([
        fetch(metaUrl),
        fetch(notesUrl)
      ]);

      if (!metaResponse.ok) throw new Error(`HTTP status ${metaResponse.status} al cargar meta.json`);
      if (!notesResponse.ok) throw new Error(`HTTP status ${notesResponse.status} al cargar notes.json`);

      const metaData = await metaResponse.json();
      const notesData = await notesResponse.json();

      const baseMeta = metaData.base || {};
      const diffMeta = (metaData.difficulties && metaData.difficulties[difficulty]) ? metaData.difficulties[difficulty] : {};

      // Fusión de metadata (Ej: si erect tiene su propio scrollSpeed o stage, sobreescribe al base)
      const finalMetadata = this._mergeMetadata(baseMeta, diffMeta);

      // --- LÓGICA MULTI-DIFICULTAD DE EVENTOS ---
      const hasEvents = (metaData.events === true || String(metaData.events).toLowerCase() === "true") || 
                        (finalMetadata.events === true || String(finalMetadata.events).toLowerCase() === "true");
      
      finalMetadata.events = hasEvents;
      let eventsArray = [];

      if (hasEvents) {
          try {
              const eventsRes = await fetch(eventsUrl);
              if (eventsRes.ok) {
                  const parsedEvents = await eventsRes.json();
                  
                  // Verificamos si existe un array específico para la dificultad actual (ej. "erect" o "nightmare")
                  if (parsedEvents[difficulty] && Array.isArray(parsedEvents[difficulty])) {
                      eventsArray = parsedEvents[difficulty];
                      console.log(`[ChartManager] events.json cargado: usando variante '${difficulty}' (${eventsArray.length} eventos).`);
                  } 
                  // Si no hay variante específica, usamos el array base "events"
                  else if (parsedEvents.events && Array.isArray(parsedEvents.events)) {
                      eventsArray = parsedEvents.events;
                      console.log(`[ChartManager] events.json cargado: usando base 'events' (${eventsArray.length} eventos).`);
                  } 
                  // Fallback por si el JSON está mal estructurado
                  else {
                      console.log(`[ChartManager] events.json cargado, pero no se encontraron arrays para '${difficulty}' ni 'events'.`);
                  }
              } else {
                  console.warn(`[ChartManager] Error HTTP ${eventsRes.status} al buscar ${eventsUrl}`);
              }
          } catch (e) {
              console.warn(`[ChartManager] La canción dice tener eventos, pero no se pudo cargar ${eventsUrl}`);
          }
      }
      // -------------------------------------------

      this.chartData = {
        metadata: {
          ...finalMetadata,
          mania: finalMetadata.lanes || 4 
        },
        notes: notesData[difficulty] || [],
        events: eventsArray // Entregamos el array ya filtrado por dificultad
      };

      return true;
    } catch (error) {
      console.error(`[ChartManager] Error crítico cargando chart en ${baseUrl}`, error);
      this.chartData = null;
      return false;
    }
  }

  /**
   * @description Obtiene datos anidados del chartData de forma segura.
   */
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