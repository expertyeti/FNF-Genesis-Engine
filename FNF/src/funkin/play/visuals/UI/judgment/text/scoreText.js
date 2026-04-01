class ScoreText {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;

    this.boping = false;
    this.alignMode = "down";

    this.formatConfig = [
      { key: "score", label: "Score", visible: true },
      { key: "misses", label: "Misses", visible: true },
      { key: "rating", label: "Rating", visible: true },
      { key: "accuracy", label: "Accuracy", visible: true },
      { key: "combo", label: "Combo", visible: true },
      { key: "maxCombo", label: "Max Combo", visible: true },
      { key: "cps", label: "CPS", visible: true }
    ];

    const screenW = scene.scale.width;
    const screenH = scene.scale.height;

    this.text = scene.add.text(0, 0, "", {
      fontFamily: "vcr",
      fontSize: "20px",
      color: "#FFFFFF",
      stroke: "#000000",
      strokeThickness: 2,
      lineSpacing: 8
    }).setDepth(98);

    this.setupPositioning(screenW, screenH);

    if (funkin.playCamera && funkin.playCamera.addObjToUI) {
      funkin.playCamera.addObjToUI(this.text);
    } else {
      this.text.setScrollFactor(0);
    }

    this.lastStatsStr = "";

    if (funkin.playNotes) {
      funkin.playNotes.event("noteHit", (data) => {
        if (!data.isPlayer || window.autoplay) return;
        if (data.judgment !== "miss") {
          this.bop();
        }
      });
    }

    scene.events.once("song_finished", this.saveScore, this);
  }

  /**
   * @param {number} screenW
   * @param {number} screenH
   */
  setupPositioning(screenW, screenH) {
    if (this.alignMode === "left") {
      this.text.x = 20;
      this.text.y = screenH / 2;
      this.text.setOrigin(0, 0.5);
      this.text.setAlign("left");
    } else if (this.alignMode === "right") {
      this.text.x = screenW - 20;
      this.text.y = screenH / 2;
      this.text.setOrigin(1, 0.5);
      this.text.setAlign("right");
    } else if (this.alignMode === "down") {
      this.text.x = screenW / 2;
      this.text.y = screenH * 0.9 + 36;
      this.text.setOrigin(0.5, 0.5);
      this.text.setAlign("center");
    }
  }

  /**
   * @param {number} time
   * @param {number} delta
   */
  update(time, delta) {
    if (this.alignMode === "down") {
      if (this.scene.healthBar && this.scene.healthBar.bgSprite) {
        this.text.x = this.scene.healthBar.bgSprite.x;
        this.text.y = this.scene.healthBar.bgSprite.y + 36;
      } else {
        this.text.x = this.scene.scale.width / 2;
        this.text.y = this.scene.scale.height * 0.9 + 36;
      }
    }

    this.updateText();
  }

  updateText() {
    const stats = funkin.playerStaticsInSong || {
      score: 0,
      misses: 0,
      combo: 0,
      maxCombo: 0,
      ratingAcc: 0,
      ratingStr: "?",
      totalNotes: 0,
      cps: 0,
      clickTimestamps: []
    };

    const now = performance.now();
    if (stats.clickTimestamps) {
      let i = 0;
      while (i < stats.clickTimestamps.length) {
        if (now - stats.clickTimestamps[i] > 1000) {
          stats.clickTimestamps.splice(i, 1);
        } else {
          i++;
        }
      }
      stats.cps = stats.clickTimestamps.length;
    }

    const ratingStr = stats.ratingStr || "?";
    const accStr = stats.totalNotes === 0 ? "0.00%" : `${stats.ratingAcc.toFixed(2)}%`;
    const scoreStr = stats.score.toLocaleString("en-US");

    const displayValues = {
      score: scoreStr,
      misses: stats.misses,
      rating: ratingStr,
      accuracy: accStr,
      combo: stats.combo,
      maxCombo: stats.maxCombo,
      cps: stats.cps || 0
    };

    const textParts = [];

    for (let i = 0; i < this.formatConfig.length; i++) {
      const item = this.formatConfig[i];
      if (item.visible) {
        if (this.alignMode === "left") {
          textParts.push(`${item.label}: ${displayValues[item.key]}`);
        } else if (this.alignMode === "right") {
          textParts.push(`${displayValues[item.key]} :${item.label}`);
        } else {
          textParts.push(`${item.label}: ${displayValues[item.key]}`);
        }
      }
    }

    const newText = this.alignMode === "down" ? textParts.join(" | ") : textParts.join("\n");

    if (this.lastStatsStr !== newText) {
      this.text.setText(newText);
      this.lastStatsStr = newText;
    }
  }

  bop() {
    if (!this.boping) return;

    this.text.scale = 1.075;
    this.scene.tweens.add({
      targets: this.text,
      scale: 1,
      duration: 100,
      ease: "Sine.easeOut"
    });
  }

  saveScore() {
    const stats = funkin.playerStaticsInSong;
    if (!stats || window.autoplay) return;

    const songId = this.scene.playData?.actuallyPlaying || "test";
    const difficulty = this.scene.playData?.difficulty?.toLowerCase() || "normal";
    const saveKey = `fnf_score_${songId}_${difficulty}`;

    const currentSaved = JSON.parse(localStorage.getItem(saveKey) || '{"score":0, "acc":0}');

    if (stats.score > currentSaved.score) {
      localStorage.setItem(saveKey, JSON.stringify({
        score: stats.score,
        acc: stats.ratingAcc
      }));
    }
  }

  destroy() {
    if (this.text) {
      this.text.destroy();
    }
  }
}

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.ScoreText = ScoreText;