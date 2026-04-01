/**
 * System to load and parse song charts (JSON).
 */
class ChartManager {
  constructor() {
    this.chartData = null; 
  }

  /**
   * @param {Object} playData
   * @returns {Promise<boolean>}
   */
  async loadChart(playData) {
    if (!playData || !playData.actuallyPlaying) {
      console.error("Invalid play data to load chart");
      return false;
    }

    const songName = playData.actuallyPlaying;
    const difficulty = (playData.difficulty || "normal").toLowerCase();

    let fileName = `${songName}-${difficulty}.json`;
    if (difficulty === "normal") {
      fileName = `${songName}.json`;
    }

    const url = `public/songs/${songName}/charts/${fileName}`;

    try {
      console.log(`Loading chart from ${url}`);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP status ${response.status}`);
      }

      this.chartData = await response.json();

      console.log("Chart loaded successfully");
      return true;
    } catch (error) {
      console.error(`Critical error loading chart at ${url}`, error);
      this.chartData = null;
      return false;
    }
  }

  /**
   * @param {string} path
   * @returns {*}
   */
  get(path) {
    if (!this.chartData) {
      console.warn("Attempted to access chart before it was loaded");
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

  /**
   * @param {number} speed
   */
  setScrollSpeed(speed) {
    if (!this.chartData) {
      console.warn("No chart loaded to change speed");
      return;
    }
    if (!this.chartData.metadata) {
      this.chartData.metadata = {};
    }

    this.chartData.metadata.speed = speed;
    console.log(`Chart speed modified to ${speed}`);
  }

  /**
   * @param {number} time
   * @param {number} direction
   * @param {boolean} isPlayer
   * @param {string} type
   */
  injectNote(time, direction, isPlayer, type = "normal") {
    if (!this.chartData) {
      console.warn("No chart loaded to inject note");
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

    console.log(`Note injected time ${time} dir ${direction} player ${isPlayer} type ${type}`);

    if (funkin.playNotes && typeof funkin.playNotes.emit === "function") {
      funkin.playNotes.emit("inject_note", newNote);
    }
  }
}

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.chart = new ChartManager();