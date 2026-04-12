/**
 * @file FreePlayDiff.js
 * Componente de interfaz de usuario para el selector de dificultad
 * y la visualización de puntaje local en Freeplay.
 */
class FreePlayDiff {
  constructor(scene) {
    this.scene = scene;
    this.difficulties = ["EASY", "NORMAL", "HARD"];

    const savedDiff = this.scene.game.registry.get("freeplayDiffIndex");
    this.currentIndex = savedDiff !== undefined ? savedDiff : 1;

    const width = this.scene.scale.width;

    this.bg = this.scene.add
      .rectangle(width, 0, 260, 130, 0x000000, 0.6)
      .setOrigin(1, 0)
      .setDepth(99);

    this.diffText = this.scene.add
      .text(width - 20, 20, `< ${this.difficulties[this.currentIndex]} >`, {
        fontFamily: "vcr",
        fontSize: "32px",
        color: "#FFFFFF",
        align: "right",
      })
      .setOrigin(1, 0)
      .setDepth(100);

    if (!this.scene.sys.game.device.os.desktop) {
      this.diffText.setInteractive();
      const padding = 20;
      const hitArea = new Phaser.Geom.Rectangle(
        -padding,
        -padding,
        this.diffText.width + padding * 2,
        this.diffText.height + padding * 2,
      );
      this.diffText.input.hitArea = hitArea;

      this.diffText.on("pointerdown", () => this.changeDifficulty(1));
    }

    this.scoreText = this.scene.add
      .text(width - 20, 60, "SCORE: 0", {
        fontFamily: "vcr",
        fontSize: "24px",
        color: "#FFFFFF",
        align: "right",
      })
      .setOrigin(1, 0)
      .setDepth(100);

    this.accuracyText = this.scene.add
      .text(width - 20, 90, "ACCURACY: 0%", {
        fontFamily: "vcr",
        fontSize: "24px",
        color: "#FFFFFF",
        align: "right",
      })
      .setOrigin(1, 0)
      .setDepth(100);
  }

  // Nueva función para actualizar la lista de dificultades de forma dinámica
  updateDifficultiesList(newList) {
    const oldDiffName = this.difficulties[this.currentIndex];

    if (!newList || newList.length === 0) {
      newList = ["easy", "normal", "hard"];
    }

    this.difficulties = newList.map(d => d.toUpperCase());

    // Intentamos mantener la misma dificultad si la nueva canción también la tiene
    if (oldDiffName) {
      const newIndex = this.difficulties.indexOf(oldDiffName);
      if (newIndex !== -1) {
        this.currentIndex = newIndex;
      } else {
        // Si no existe, buscamos "NORMAL" por defecto, o la primera.
        const normalIndex = this.difficulties.indexOf("NORMAL");
        this.currentIndex = normalIndex !== -1 ? normalIndex : 0;
      }
    } else {
      this.currentIndex = 0;
    }

    this.scene.game.registry.set("freeplayDiffIndex", this.currentIndex);
    this.diffText.setText(`< ${this.difficulties[this.currentIndex]} >`);

    // Actualizar hitbox táctil si aplica
    if (!this.scene.sys.game.device.os.desktop && this.diffText.input) {
      const padding = 20;
      this.diffText.input.hitArea.width = this.diffText.width + padding * 2;
    }

    // Refrescar el puntaje visual
    if (this.scene.songsManager) {
      const currentSong = this.scene.songsManager.getCurrentSong();
      const songName =
        typeof currentSong === "string"
          ? currentSong
          : currentSong && (currentSong.songName || currentSong.name);
      if (songName) this.updateScoreDisplay(songName);
    }
  }

  changeDifficulty(change) {
    this.currentIndex += change;

    if (this.currentIndex < 0) this.currentIndex = this.difficulties.length - 1;
    else if (this.currentIndex >= this.difficulties.length)
      this.currentIndex = 0;

    this.scene.game.registry.set("freeplayDiffIndex", this.currentIndex);
    this.diffText.setText(`< ${this.difficulties[this.currentIndex]} >`);

    if (!this.scene.sys.game.device.os.desktop && this.diffText.input) {
      const padding = 20;
      this.diffText.input.hitArea.width = this.diffText.width + padding * 2;
    }

    if (this.scene.songsManager) {
      const currentSong = this.scene.songsManager.getCurrentSong();
      const songName =
        typeof currentSong === "string"
          ? currentSong
          : currentSong && (currentSong.songName || currentSong.name);
      if (songName) this.updateScoreDisplay(songName);
    }
  }

  updateScoreDisplay(songName) {
    if (!songName) return;
    try {
      const diffStr = this.difficulties[this.currentIndex].toLowerCase();
      const saved = JSON.parse(
        localStorage.getItem(`fnf_score_${songName}_${diffStr}`) ||
          '{"score":0, "acc":0}',
      );

      const accStr = saved.acc > 0 ? saved.acc.toFixed(2) : "0";
      const formatScore = saved.score.toLocaleString("en-US");

      this.scoreText.setText(`SCORE: ${formatScore}`);
      this.accuracyText.setText(`ACCURACY: ${accStr}%`);
    } catch (e) {
      console.warn(`Error recuperando puntaje para ${songName}`);
      this.scoreText.setText(`SCORE: 0`);
      this.accuracyText.setText(`ACCURACY: 0%`);
    }
  }

  destroy() {
    if (this.bg) this.bg.destroy();
    if (this.diffText) {
      this.diffText.off("pointerdown");
      this.diffText.destroy();
    }
    if (this.scoreText) this.scoreText.destroy();
    if (this.accuracyText) this.accuracyText.destroy();
  }
}

funkin.ui.freeplay.FreePlayDiff = FreePlayDiff;