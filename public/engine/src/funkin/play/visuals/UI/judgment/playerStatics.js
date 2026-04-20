window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.ui = funkin.play.visuals.ui || {};

/**
 * Gestor de estadísticas en partida.
 * Calcula precisión, combos, puntuación y emite eventos globales.
 */
class PlayerStatics {
  constructor() {
    this.reset();
    this.setupEvents();
  }

  reset() {
    const baseStats = { combo: 0, maxCombo: 0, misses: 0, score: 0, sick: 0, good: 0, bad: 0, shit: 0, totalNotes: 0, accuracy: 0.0, rating: "?", cps: 0, clickTimestamps: [] };
    funkin.playerStaticsInSong = { ...baseStats };
    funkin.player2StaticsInSong = { ...baseStats };
    funkin.play.health = funkin.play.health || { health: 1.0, healthLerp: 1.0 };
  }

  setupEvents() {
    funkin.playNotes?.event("noteHit", (hitData) => {
      if (hitData.judgment === "miss") return this.registerMiss(hitData);

      const isPlayerNote = hitData.isPlayer === true;
      const targetStats = this._getTargetStats(isPlayerNote);

      if (targetStats && !hitData.isAuto) {
        const absTiming = Math.abs(hitData.ms || 0);

        if (absTiming <= 45.0) targetStats.sick++;
        else if (absTiming <= 90.0) targetStats.good++;
        else if (absTiming <= 135.0) targetStats.bad++;
        else targetStats.shit++;

        targetStats.combo++;
        targetStats.score += absTiming < 5.0 ? 500 : Math.floor(9 + 491 * Math.max(0, 1.0 - (absTiming - 5.0) / 155.0));
        targetStats.totalNotes++;

        if (targetStats.combo === 50 || targetStats.combo === 200) {
            document.dispatchEvent(new CustomEvent('funkin_combo', { detail: { isPlayer: isPlayerNote, combo: targetStats.combo } }));
        }

        targetStats.maxCombo = Math.max(targetStats.maxCombo, targetStats.combo);
      }

      this._updateHealth(0.023, isPlayerNote);
      this.updateRating();
    });

    funkin.playNotes?.event("noteMiss", (hitData) => {
      this.registerMiss(hitData);
      this.updateRating();
    });
  }

  registerMiss(hitData) {
    const isPlayerNote = hitData.isPlayer === true;

    if (hitData?.isSustain) {
        return this._updateHealth(-0.005, isPlayerNote);
    }

    const targetStats = this._getTargetStats(isPlayerNote);
    if (targetStats && !hitData.isAuto) {
      if (targetStats.combo >= 70) {
          document.dispatchEvent(new CustomEvent('funkin_comboDrop', { detail: { isPlayer: isPlayerNote, droppedCombo: targetStats.combo } }));
      }
      targetStats.combo = 0;
      targetStats.misses++;
      targetStats.score -= 100;
      targetStats.totalNotes++;
    }

    this._updateHealth(-0.0475, isPlayerNote);
  }

  _getTargetStats(isPlayerNote) {
    const isTwoPlayer = funkin.play?.options?.twoPlayerLocal;
    const playAsOpponent = funkin.play?.options?.playAsOpponent;
    
    if (isTwoPlayer) return isPlayerNote ? funkin.playerStaticsInSong : funkin.player2StaticsInSong;
    return (playAsOpponent ? !isPlayerNote : isPlayerNote) ? funkin.playerStaticsInSong : null;
  }

  _updateHealth(amount, isPlayerNote) {
    if (!funkin.play?.health) return;

    const isTwoPlayer = funkin.play.options?.twoPlayerLocal;
    const playAsOpponent = funkin.play.options?.playAsOpponent;
    
    let applyHealth = false;
    if (isTwoPlayer) amount = isPlayerNote ? amount : -amount;
    else if (playAsOpponent ? !isPlayerNote : isPlayerNote) applyHealth = true;

    if (isTwoPlayer || applyHealth) {
        funkin.play.health.health = Math.max(0, Math.min(2, funkin.play.health.health + amount));
    }
  }

  updateRating() {
    const calcStats = (stats) => {
        if (!stats || stats.totalNotes === 0) return stats && (stats.accuracy = 0.0, stats.rating = "?");

        stats.accuracy = Math.max(0, ((stats.sick + stats.good) - stats.misses) / stats.totalNotes) * 100;
        
        if (stats.accuracy >= 100) stats.rating = "SSS";
        else if (stats.accuracy >= 95) stats.rating = "S";
        else if (stats.accuracy >= 90) stats.rating = "A";
        else if (stats.accuracy >= 80) stats.rating = "B";
        else if (stats.accuracy >= 70) stats.rating = "C";
        else if (stats.accuracy >= 60) stats.rating = "D";
        else stats.rating = "F";
    };

    calcStats(funkin.playerStaticsInSong);
    calcStats(funkin.player2StaticsInSong);
  }

  destroy() {
    funkin.playerStaticsInSong = null;
    funkin.player2StaticsInSong = null;
  }
}

funkin.play.visuals.ui.PlayerStatics = PlayerStatics;