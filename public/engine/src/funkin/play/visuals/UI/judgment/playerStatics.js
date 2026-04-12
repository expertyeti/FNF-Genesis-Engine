/**
 * @file src/funkin/play/visuals/UI/judgment/playerStatics.js
 */
window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.ui = funkin.play.visuals.ui || {};

class PlayerStatics {
  constructor() {
    this.reset();
    this.setupEvents();
  }

  reset() {
    // CORRECCIÓN: Usar "accuracy" y "rating" exactos para que el TextScore los pueda leer
    funkin.playerStaticsInSong = { combo: 0, maxCombo: 0, misses: 0, score: 0, sick: 0, good: 0, bad: 0, shit: 0, totalNotes: 0, accuracy: 0.0, rating: "?", cps: 0, clickTimestamps: [] };
    funkin.player2StaticsInSong = { combo: 0, maxCombo: 0, misses: 0, score: 0, sick: 0, good: 0, bad: 0, shit: 0, totalNotes: 0, accuracy: 0.0, rating: "?", cps: 0, clickTimestamps: [] };

    funkin.play = funkin.play || {};
    funkin.play.health = funkin.play.health || { health: 1.0, healthLerp: 1.0 };
  }

  setupEvents() {
    if (funkin.playNotes) {
      funkin.playNotes.event("noteHit", (hitData) => {
        const isTwoPlayer = funkin.play?.options?.twoPlayerLocal === true;
        const playAsOpponent = funkin.play?.options?.playAsOpponent === true;
        
        let targetStats = null;
        if (isTwoPlayer) {
            targetStats = hitData.isPlayer ? funkin.playerStaticsInSong : funkin.player2StaticsInSong;
        } else {
            const isMyNote = playAsOpponent ? !hitData.isPlayer : hitData.isPlayer;
            if (isMyNote) targetStats = funkin.playerStaticsInSong;
        }

        if (hitData.judgment !== "miss") {
          if (targetStats && !hitData.isAuto) {
            const absTiming = Math.abs(hitData.ms || 0);

            if (absTiming <= 45.0) targetStats.sick++;
            else if (absTiming <= 90.0) targetStats.good++;
            else if (absTiming <= 135.0) targetStats.bad++;
            else targetStats.shit++;

            let noteScore = 0;
            if (absTiming < 5.0) noteScore = 500;
            else {
              const factor = Math.max(0, 1.0 - (absTiming - 5.0) / 155.0);
              noteScore = Math.floor(9 + 491 * factor);
            }

            targetStats.combo++;
            targetStats.score += noteScore;
            targetStats.totalNotes++;

            if (targetStats.combo > targetStats.maxCombo) targetStats.maxCombo = targetStats.combo;
          }

          if (funkin.play.health) {
            if (isTwoPlayer) {
              funkin.play.health.health += hitData.isPlayer ? 0.023 : -0.023;
            } else {
              const isMyNote = playAsOpponent ? !hitData.isPlayer : hitData.isPlayer;
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
  }

  registerMiss(hitData) {
    const isTwoPlayer = funkin.play?.options?.twoPlayerLocal === true;
    const playAsOpponent = funkin.play?.options?.playAsOpponent === true;
    
    let targetStats = null;
    if (isTwoPlayer) {
        targetStats = hitData.isPlayer ? funkin.playerStaticsInSong : funkin.player2StaticsInSong;
    } else {
        const isMyNote = playAsOpponent ? !hitData.isPlayer : hitData.isPlayer;
        if (isMyNote) targetStats = funkin.playerStaticsInSong;
    }

    if (hitData && hitData.isSustain) {
      if (funkin.play && funkin.play.health) {
        if (isTwoPlayer) {
          funkin.play.health.health += hitData.isPlayer ? -0.005 : 0.005;
        } else {
          const isMyNote = playAsOpponent ? !hitData.isPlayer : hitData.isPlayer;
          if (isMyNote) funkin.play.health.health += playAsOpponent ? 0.005 : -0.005;
        }

        if (funkin.play.health.health < 0) funkin.play.health.health = 0;
        if (funkin.play.health.health > 2) funkin.play.health.health = 2;
      }
      return;
    }

    if (targetStats && !hitData.isAuto) {
      targetStats.combo = 0;
      targetStats.misses++;
      targetStats.score -= 100;
      targetStats.totalNotes++; // CRÍTICO para calcular el accuracy
    }

    if (funkin.play && funkin.play.health) {
      if (isTwoPlayer) {
        funkin.play.health.health += hitData.isPlayer ? -0.0475 : 0.0475;
      } else {
        const isMyNote = playAsOpponent ? !hitData.isPlayer : hitData.isPlayer;
        if (isMyNote) funkin.play.health.health += playAsOpponent ? 0.0475 : -0.0475;
      }

      if (funkin.play.health.health < 0) funkin.play.health.health = 0;
      if (funkin.play.health.health > 2) funkin.play.health.health = 2;
    }
  }

  updateRating() {
    // Calculo que evalúa el rating real asignándolo a 'accuracy' y 'rating'
    const calcStats = (stats) => {
        if (stats.totalNotes > 0) {
          const positiveHits = stats.sick + stats.good;
          let rawAccuracy = (positiveHits - stats.misses) / stats.totalNotes;
          if (rawAccuracy < 0) rawAccuracy = 0;
          stats.accuracy = rawAccuracy * 100; // Asignamos a .accuracy
        } else {
          stats.accuracy = 0.0;
        }

        const acc = stats.accuracy;
        let ratingStr = "?";

        if (stats.totalNotes === 0) ratingStr = "?";
        else if (acc >= 100) ratingStr = "SSS";
        else if (acc >= 95) ratingStr = "S";
        else if (acc >= 90) ratingStr = "A";
        else if (acc >= 80) ratingStr = "B";
        else if (acc >= 70) ratingStr = "C";
        else if (acc >= 60) ratingStr = "D";
        else ratingStr = "F";

        stats.rating = ratingStr; // Asignamos a .rating
    };

    if (funkin.playerStaticsInSong) calcStats(funkin.playerStaticsInSong);
    if (funkin.player2StaticsInSong) calcStats(funkin.player2StaticsInSong);
  }

  destroy() {
    funkin.playerStaticsInSong = null;
    funkin.player2StaticsInSong = null;
  }
}

funkin.play.visuals.ui.PlayerStatics = PlayerStatics;