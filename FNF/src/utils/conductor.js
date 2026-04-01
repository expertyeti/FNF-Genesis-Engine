class Conductor {
  constructor() {
    if (!funkin.conductorEvents) {
      funkin.conductorEvents = new Phaser.Events.EventEmitter();
    }

    this.events = funkin.conductorEvents;

    this._bpm = 120;

    this.crochet = (60 / this._bpm) * 1000;
    this.stepCrochet = this.crochet / 4;
    
    this.songPosition = 0; // Registro global del tiempo de la cancion

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

          console.log("BPM updated from", oldBpm, "to", this._bpm);
        } else {
          console.warn("Attempted to set invalid BPM:", num);
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

if (typeof window !== "undefined") {
  funkin.conductor = new Conductor();
}