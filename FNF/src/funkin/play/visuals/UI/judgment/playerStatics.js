class PlayerStatics {
  constructor() {
    this.reset();
    this.setupEvents();

    /**
     * @type {EventListener}
     */
    this._keydownListener = (event) => {
      if (!event.repeat) {
        this.registerClick();
      }
    };
    window.addEventListener("keydown", this._keydownListener);
  }

  reset() {
    funkin.playerStaticsInSong = {
      combo: 0,
      maxCombo: 0,
      misses: 0,
      score: 0,
      sick: 0,
      good: 0,
      bad: 0,
      shit: 0,
      totalNotes: 0,
      ratingAcc: 0.0,
      ratingStr: "?",
      cps: 0,
      clickTimestamps: []
    };

    funkin.play = funkin.play || {};
    funkin.play.health = funkin.play.health || {
      health: 1.0,
      healthLerp: 1.0
    };
  }

  setupEvents() {
    if (!funkin.playNotes) return;

    funkin.playNotes.event("noteHit", (hitData) => {
      const isMultiplayer = funkin.play?.options?.isMultiplayer === true;
      const playAsOpponent = funkin.play?.options?.playAsOpponent === true;
      const isMyNote = playAsOpponent ? !hitData.isPlayer : hitData.isPlayer;

      if (hitData.judgment !== "miss") {
        if (isMyNote && !hitData.isAuto) {
          const absTiming = Math.abs(hitData.ms || 0);

          if (absTiming <= 45.0) {
            funkin.playerStaticsInSong.sick++;
          } else if (absTiming <= 90.0) {
            funkin.playerStaticsInSong.good++;
          } else if (absTiming <= 135.0) {
            funkin.playerStaticsInSong.bad++;
          } else {
            funkin.playerStaticsInSong.shit++;
          }

          let noteScore = 0;
          if (absTiming < 5.0) {
            noteScore = 500;
          } else {
            const factor = Math.max(0, 1.0 - (absTiming - 5.0) / 155.0);
            noteScore = Math.floor(9 + 491 * factor);
          }

          funkin.playerStaticsInSong.combo++;
          funkin.playerStaticsInSong.score += noteScore;
          funkin.playerStaticsInSong.totalNotes++;

          if (funkin.playerStaticsInSong.combo > funkin.playerStaticsInSong.maxCombo) {
            funkin.playerStaticsInSong.maxCombo = funkin.playerStaticsInSong.combo;
          }
        }

        if (funkin.play.health) {
          if (isMultiplayer) {
            funkin.play.health.health += hitData.isPlayer ? 0.023 : -0.023;
          } else {
            if (isMyNote) {
              funkin.play.health.health += playAsOpponent ? -0.023 : 0.023;
            }
          }

          if (funkin.play.health.health > 2.0) funkin.play.health.health = 2.0;
          if (funkin.play.health.health < 0.0) funkin.play.health.health = 0.0;
        }
      } else {
        this.registerMiss(hitData);
      }
      this.updateRating();
    });

    funkin.playNotes.event("noteMiss", (hitData) => {
      this.registerMiss(hitData);
      this.updateRating();
    });
  }

  registerClick() {
    if (funkin.playerStaticsInSong && funkin.playerStaticsInSong.clickTimestamps) {
      funkin.playerStaticsInSong.clickTimestamps.push(performance.now());
    }
  }

  /**
   * @param {Object} hitData
   */
  registerMiss(hitData) {
    const isMultiplayer = funkin.play?.options?.isMultiplayer === true;
    const playAsOpponent = funkin.play?.options?.playAsOpponent === true;
    const isMyNote = playAsOpponent ? !hitData.isPlayer : hitData.isPlayer;

    if (hitData && hitData.isSustain) {
      if (funkin.play && funkin.play.health) {
        if (isMultiplayer) {
          funkin.play.health.health += hitData.isPlayer ? -0.005 : 0.005;
        } else {
          if (isMyNote) {
            funkin.play.health.health += playAsOpponent ? 0.005 : -0.005;
          }
        }

        if (funkin.play.health.health < 0) funkin.play.health.health = 0;
        if (funkin.play.health.health > 2) funkin.play.health.health = 2;
      }
      return;
    }

    if (isMyNote && !hitData.isAuto) {
      funkin.playerStaticsInSong.combo = 0;
      funkin.playerStaticsInSong.misses++;
      funkin.playerStaticsInSong.score -= 100;
      funkin.playerStaticsInSong.totalNotes++;
    }

    if (funkin.play && funkin.play.health) {
      if (isMultiplayer) {
        funkin.play.health.health += hitData.isPlayer ? -0.0475 : 0.0475;
      } else {
        if (isMyNote) {
          funkin.play.health.health += playAsOpponent ? 0.0475 : -0.0475;
        }
      }

      if (funkin.play.health.health < 0) funkin.play.health.health = 0;
      if (funkin.play.health.health > 2) funkin.play.health.health = 2;
    }
  }

  updateRating() {
    const stats = funkin.playerStaticsInSong;
    if (stats.totalNotes > 0) {
      const positiveHits = stats.sick + stats.good;
      let rawAccuracy = (positiveHits - stats.misses) / stats.totalNotes;

      if (rawAccuracy < 0) rawAccuracy = 0;
      stats.ratingAcc = rawAccuracy * 100;
    } else {
      stats.ratingAcc = 0.0;
    }

    const acc = stats.ratingAcc;
    let ratingStr = "?";

    if (stats.totalNotes === 0) {
      ratingStr = "?";
    } else if (acc >= 100) {
      ratingStr = "SSS";
    } else if (acc >= 95) {
      ratingStr = "S";
    } else if (acc >= 90) {
      ratingStr = "A";
    } else if (acc >= 80) {
      ratingStr = "B";
    } else if (acc >= 70) {
      ratingStr = "C";
    } else if (acc >= 60) {
      ratingStr = "D";
    } else {
      ratingStr = "F";
    }

    stats.ratingStr = ratingStr;
  }

  destroy() {
    if (this._keydownListener) {
      window.removeEventListener("keydown", this._keydownListener);
    }
    funkin.playerStaticsInSong = null;
  }
}

funkin.PlayerStatics = PlayerStatics;