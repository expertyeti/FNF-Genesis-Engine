/**
 * Top bar UI component for Story Mode managing dynamic score counting based on difficulty.
 */
class StoryModeUpBar {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;

    this.bg = this.scene.add
      .rectangle(0, 0, this.scene.scale.width, 56, 0x000000)
      .setOrigin(0, 0)
      .setAlpha(1)
      .setDepth(1000);

    this.targetScore = 0;
    this.highScoreLerp = 0;

    this.scoreText = this.scene.add
      .text(10, 10, "LEVEL SCORE: 0", {
        fontFamily: "vcr",
        fontSize: "32px",
        color: "#FFFFFF",
      })
      .setDepth(1001);

    this.levelTitleText = this.scene.add
      .text(this.scene.scale.width - 10, 10, "LEVEL 1", {
        fontFamily: "vcr",
        fontSize: "32px",
        color: "#FFFFFF",
        align: "right",
      })
      .setOrigin(1, 0)
      .setAlpha(0.7)
      .setDepth(1001);
  }

  /**
   * Called to update the displayed week data and calculate cumulative local score per difficulty.
   * @param {Object} currentWeek
   * @param {string} difficulty
   */
  updateWeekData(currentWeek, difficulty) {
    let weekScore = 0;
    const diffStr = difficulty ? difficulty.toLowerCase() : "normal";

    if (currentWeek && currentWeek.data && Array.isArray(currentWeek.data.songs)) {
      currentWeek.data.songs.forEach((songObj) => {
        const songName = typeof songObj === "string" ? songObj : songObj.song;
        if (songName) {
          try {
            const saved = JSON.parse(localStorage.getItem(`fnf_score_${songName}_${diffStr}`) || '{"score":0}');
            weekScore += saved.score || 0;
          } catch (e) {
            console.warn(`Failed parsing score for ${songName}`);
          }
        }
      });
    }

    this.targetScore = weekScore;

    let phraseText = "";
    if (currentWeek && currentWeek.data && typeof currentWeek.data.phrase === "string") {
      phraseText = currentWeek.data.phrase;
    }

    this.levelTitleText.setText(phraseText.toUpperCase());
  }

  /**
   * @param {number} time
   * @param {number} delta
   */
  update(time, delta) {
    const lerpFactor = Math.min(1, (delta / 1000) * 12);

    this.highScoreLerp += (this.targetScore - this.highScoreLerp) * lerpFactor;

    if (Math.abs(this.targetScore - this.highScoreLerp) < 0.5) {
      this.highScoreLerp = this.targetScore;
    }

    const roundedFormat = Math.round(this.highScoreLerp).toLocaleString('en-US');
    this.scoreText.setText(`LEVEL SCORE: ${roundedFormat}`);
  }
}

window.StoryModeUpBar = StoryModeUpBar;