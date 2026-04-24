/**
 * @file events.js
 * @description Gestor de Eventos del Genesis Engine.
 * Precarga y ejecuta scripts de eventos dinámicamente desde el archivo events.json,
 * inyectando las APIs automáticamente para evitar que los modders usen namespaces largos.
 */

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.scripts = funkin.play.scripts || {};

class EventManager {
  /**
   * @param {Phaser.Scene} scene - Referencia a la PlayScene actual.
   */
  constructor(scene) {
    this.scene = scene;
    /** @type {Array} Lista de eventos ordenados por tiempo que aún no se ejecutan */
    this.pendingEvents = [];
    /** @type {Map<string, function>} Caché de scripts pre-compilados e inyectados */
    this.loadedScripts = new Map();
  }

  /**
   * @description Lee el JSON de eventos, extrae los scripts únicos y los descarga.
   * Luego inyecta las APIs globalmente dentro de cada script.
   */
  async preloadEvents() {
    // CORRECCIÓN AQUÍ: Leemos directamente el array "events" que generó ChartManager
    const eventsData = funkin.play.chart?.get("events") || [];

    if (!eventsData || eventsData.length === 0) {
      console.log("[EventManager] No hay eventos en esta canción.");
      return;
    }

    // Ordenar los eventos cronológicamente
    this.pendingEvents = [...eventsData].sort(
      (a, b) => Number(a.time) - Number(b.time),
    );

    const uniqueScripts = [...new Set(this.pendingEvents.map((e) => e.script))];
    const baseUrl = window.BASE_URL || "";

    for (const scriptName of uniqueScripts) {
      try {
        const response = await fetch(
          `${baseUrl}assets/scripts/events/${scriptName}.js`,
        );
        if (response.ok) {
          const scriptCode = await response.text();

          const scriptWrapper = new Function(
            "GameAPI",
            "Camera",
            "eventData",
            `
                        ${scriptCode}
                        if (typeof executeEvent === 'function') {
                            executeEvent(eventData);
                        }
                    `,
          );

          this.loadedScripts.set(scriptName, scriptWrapper);
          console.log(
            `[EventManager] Mod script '${scriptName}.js' inyectado y compilado.`,
          );
        }
      } catch (e) {
        console.error(
          `[EventManager] Error cargando el script '${scriptName}':`,
          e,
        );
      }
    }
  }

  /**
   * @description Reinicia la lista de eventos pendientes.
   * Usado cuando se reinicia la canción (restart) por pauseFunctions.js.
   */
  reset() {
    const eventsData = funkin.play.chart?.get("events") || [];
    
    if (!eventsData || eventsData.length === 0) {
      this.pendingEvents = [];
      return;
    }

    // Volver a clonar y ordenar los eventos originales cronológicamente
    this.pendingEvents = [...eventsData].sort(
      (a, b) => Number(a.time) - Number(b.time),
    );
    
    console.log("[EventManager] Eventos pendientes reiniciados (Restart).");
  }

  /**
   * @description Revisa constantemente si es momento de ejecutar un evento.
   * Se llama desde el PhasePlaying.js en cada frame.
   * @param {number} songPosition - Milisegundos transcurridos en la canción.
   */
  update(songPosition) {
    // Mientras haya eventos pendientes y el tiempo del primer evento ya haya pasado
    while (
      this.pendingEvents.length > 0 &&
      this.pendingEvents[0].time <= songPosition
    ) {
      const eventData = this.pendingEvents.shift(); // Sacar el evento de la lista
      const scriptExecutor = this.loadedScripts.get(eventData.script);

      if (scriptExecutor) {
        try {
          // ¡EJECUTAR EL SCRIPT!
          // Le pasamos las variables del sistema y la data de ese evento en específico
          scriptExecutor(window.GameAPI, window.Camera, eventData);
        } catch (e) {
          console.error(
            `[EventManager] Error al ejecutar evento '${eventData.script}' en el tiempo ${eventData.time}:`,
            e,
          );
        }
      }
    }
  }

  /**
   * @description Limpia la memoria para evitar cruces con otras canciones.
   */
  destroy() {
    this.pendingEvents = [];
    this.loadedScripts.clear();
    console.log("[EventManager] Destruido.");
  }
}

funkin.play.scripts.EventManager = EventManager;