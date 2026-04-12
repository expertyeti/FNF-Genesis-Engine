/**
 * @file conductor.js
 * Sistema global para sincronización de tiempo, ritmos y BPM (Beats Per Minute).
 */

window.funkin = window.funkin || {};

class Conductor {
  constructor() {
    // Garantizamos que el Event Bus exista globalmente usando Phaser
    if (!funkin.conductorEvents) {
      funkin.conductorEvents = new Phaser.Events.EventEmitter();
    }

    this.events = funkin.conductorEvents;

    this._bpm = 120;

    this.crochet = (60 / this._bpm) * 1000;
    this.stepCrochet = this.crochet / 4;
    
    this.songPosition = 0; // Registro global del tiempo de la canción

    this.bpm = {
      /**
       * @param {number} num
       */
      set: (num) => {
        if (typeof num === "number" && num > 0) {
          if (num === this._bpm) {
            return;
          }

          const oldBpm = this._bpm;
          this._bpm = num;

          this.crochet = (60 / this._bpm) * 1000;
          this.stepCrochet = this.crochet / 4;

          this.events.emit("bpm_changed", this._bpm, oldBpm);

          console.log(`[Genesis Engine] BPM actualizado de ${oldBpm} a ${this._bpm}`);
        } else {
          console.warn("[Genesis Engine] Intento de establecer un BPM inválido:", num);
        }
      },

      /**
       * @returns {number}
       */
      get: () => {
        return this._bpm;
      }
    };
  }
}

// Registro explícito en el árbol global
funkin.ConductorClass = Conductor;

// Inicialización de la instancia global (Singleton)
funkin.conductor = new Conductor();