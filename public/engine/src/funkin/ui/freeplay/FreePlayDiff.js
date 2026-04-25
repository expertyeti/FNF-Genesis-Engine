// src/funkin/ui/freeplay/FreePlayDiff.js

window.funkin = window.funkin || {};
window.funkin.ui = window.funkin.ui || {};
window.funkin.ui.freeplay = window.funkin.ui.freeplay || {};

class FreePlayDiff {
  constructor(scene) {
    this.scene = scene;
    this.difficulties = ["EASY", "NORMAL", "HARD"]; 
    this.currentIndex = 1;

    const width = this.scene.scale.width;

    this.bg = this.scene.add
      .rectangle(width, 0, 260, 130, 0x000000, 0.6)
      .setOrigin(1, 0)
      .setDepth(99);

    this.diffText = this.scene.add
      .text(width - 20, 20, `< Cargando >`, {
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

  initGlobalDifficulties(diffList) {
    this.difficulties = diffList;
    
    const savedDiff = this.scene.game.registry.get("freeplayGlobalDiff") || "NORMAL";
    this.currentIndex = this.difficulties.indexOf(savedDiff);
    
    if (this.currentIndex === -1) {
        this.currentIndex = this.difficulties.indexOf("NORMAL");
        if (this.currentIndex === -1) this.currentIndex = 0;
    }

    this.updateUI();

    if (this.scene.songsManager) {
        this.scene.songsManager.applyDifficultyFilter(this.difficulties[this.currentIndex]);
    }
  }

  updateUI() {
    this.scene.game.registry.set("freeplayGlobalDiff", this.difficulties[this.currentIndex]);
    this.diffText.setText(`< ${this.difficulties[this.currentIndex]} >`);

    if (!this.scene.sys.game.device.os.desktop && this.diffText.input) {
      const padding = 20;
      this.diffText.input.hitArea.width = this.diffText.width + padding * 2;
    }
  }

  changeDifficulty(change) {
    if (this.diffText.text === "< Cargando >") return;

    this.currentIndex += change;

    if (this.currentIndex < 0) this.currentIndex = this.difficulties.length - 1;
    else if (this.currentIndex >= this.difficulties.length)
      this.currentIndex = 0;

    this.updateUI();

    if (this.scene.songsManager) {
      this.scene.songsManager.applyDifficultyFilter(this.difficulties[this.currentIndex]);
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