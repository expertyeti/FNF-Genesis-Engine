/**
 * @file StoryModeUpBar.js
 * Barra superior que muestra el score y la frase de la semana.
 */
class StoryModeUpBar {
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

  updateWeekData(currentWeek, difficulty) {
    let weekScore = 0;
    const diffStr = difficulty ? difficulty.toLowerCase() : "normal";

    if (
      currentWeek &&
      currentWeek.data &&
      Array.isArray(currentWeek.data.songs)
    ) {
      currentWeek.data.songs.forEach((songObj) => {
        const songName = typeof songObj === "string" ? songObj : songObj.song;
        if (songName) {
          try {
            const saved = JSON.parse(
              localStorage.getItem(`fnf_score_${songName}_${diffStr}`) ||
                '{"score":0}',
            );
            weekScore += saved.score || 0;
          } catch (e) {}
        }
      });
    }

    this.targetScore = weekScore;

    let phraseText = "";
    if (
      currentWeek &&
      currentWeek.data &&
      typeof currentWeek.data.phrase === "string"
    ) {
      phraseText = currentWeek.data.phrase;
    }

    this.levelTitleText.setText(phraseText.toUpperCase());
  }

  update(time, delta) {
    const lerpFactor = Math.min(1, (delta / 1000) * 12);
    this.highScoreLerp += (this.targetScore - this.highScoreLerp) * lerpFactor;

    if (Math.abs(this.targetScore - this.highScoreLerp) < 0.5) {
      this.highScoreLerp = this.targetScore;
    }

    const roundedFormat = Math.round(this.highScoreLerp).toLocaleString(
      "en-US",
    );
    this.scoreText.setText(`LEVEL SCORE: ${roundedFormat}`);
  }
}

funkin.ui.storyMode.StoryModeUpBar = StoryModeUpBar;
