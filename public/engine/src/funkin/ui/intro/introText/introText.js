/**
 * @file introText.js
 */

class IntroTextScene extends Phaser.Scene {
  constructor() {
    super({ key: "IntroTextScene" });
    this.music = null;
    this.randomTextPairs = [];
    this.texts = [];
    this.imageObj = null;
    this.currentYOffset = 0;
    this.sceneEnded = false;
    this.currentRandomPair = null;

    this.startY = 300;
    this.lineSpacing = 55;

    this.introEvents = [];
    this.currentEventIndex = 0;
  }

  create() {
    window.Alphabet.createAtlas(this);

    const introData = this.cache.json.get("introData");
    const sequence = introData ? introData.introSequences.find(s => s.id === 'default') : null;

    if (!sequence) {
      console.warn("Genesis Engine: No se encontró la secuencia 'default' en introData.");
      return;
    }

    let currentBpm = funkin.conductor ? funkin.conductor.bpm.get() : sequence.bpm;
    const steps = sequence.steps;
    const beatTime = funkin.conductor ? funkin.conductor.crochet : ((60 / currentBpm) * 1000);

    const textFile = this.cache.text.get("randomText");
    if (textFile) {
      this.randomTextPairs = textFile
        .split("\n")
        .filter((line) => line.trim() !== "")
        .map((line) => {
          const parts = line.split("--").map((part) => part.trim().toUpperCase());
          return parts.length >= 2 ? parts : [parts[0], ""];
        });
    } else {
      this.randomTextPairs = [["GENESIS", "ENGINE"]];
    }

    this.introEvents = steps.map(step => ({
      ...step,
      targetTime: step.beat * beatTime
    }));
    this.introEvents.sort((a, b) => a.targetTime - b.targetTime);
    this.currentEventIndex = 0;

    this.music = this.sound.add("freakyMenu", { loop: true });
    this.music.play();

    if (!this.sys.game.device.os.desktop) {
        this.input.on('pointerdown', () => {
            this.skipIntro();
        });
    }
  }

  update(time, delta) {
    if (this.sceneEnded) return;

    if (funkin.controls) {
      funkin.controls.update();
    }

    if (funkin.controls && funkin.controls.ACCEPT_P) {
      this.skipIntro();
      return;
    }

    if (!this.music || !this.music.isPlaying) return;

    const currentSongTime = this.music.seek * 1000;

    while (this.currentEventIndex < this.introEvents.length) {
      const nextEvent = this.introEvents[this.currentEventIndex];

      if (currentSongTime >= nextEvent.targetTime) {
        this.processJsonStep(nextEvent);
        this.currentEventIndex++;
      } else {
        break;
      }
    }
  }

  processJsonStep(step) {
    let shouldVibrate = false;

    if (step.clear) {
      shouldVibrate = true;
      this.texts.forEach((t) => t.destroy());
      this.texts = [];
      if (this.imageObj) {
        this.imageObj.destroy();
        this.imageObj = null;
      }
      this.currentYOffset = 0;
    }

    if (step.text && step.text.length > 0) {
      shouldVibrate = true;
      step.text.forEach(line => {
        this.displayTextLine(line);
      });
    }

    if (step.img) {
      shouldVibrate = true;
      if (this.imageObj) this.imageObj.destroy();

      this.imageObj = this.add.image(
        this.cameras.main.width / 2,
        this.startY + this.currentYOffset + 80,
        step.img.id
      )
        .setOrigin(0.5, 0.5)
        .setScale(step.img.scale || 1);

      this.currentYOffset += 100;
    }

    if (step.action) {
      switch (step.action) {
        case "random-text-1":
          shouldVibrate = true;
          this.currentRandomPair = this.getRandomTextPair();
          this.displayTextLine(this.currentRandomPair[0]);
          break;
        case "random-text-2":
          shouldVibrate = true;
          if (!this.currentRandomPair) {
            this.currentRandomPair = this.getRandomTextPair();
          }
          this.displayTextLine(this.currentRandomPair[1]);
          break;
        case "skipIntro":
          this.skipIntro();
          break;
      }
    }

    this.attemptVibration(shouldVibrate);
  }

  skipIntro() {
    if (this.sceneEnded) return;
    this.sceneEnded = true;
    
    this.attemptVibration(true);

    const flashScene = this.scene.get("FlashEffect");
    if (flashScene) {
        flashScene.startTransition("introDance");
    } else {
        this.scene.start("introDance");
    }
  }

  /**
   * Intenta vibrar solo si el navegador lo permite para evitar alertas de intervención.
   * @param {boolean} condition 
   */
  attemptVibration(condition) {
    if (condition && navigator.vibrate) {
      try {
        if (navigator.userActivation && navigator.userActivation.hasBeenActive) {
          navigator.vibrate(70);
        } else if (typeof navigator.userActivation === "undefined") {
          navigator.vibrate(70);
        }
      } catch (e) {}
    }
  }

  displayTextLine(textString) {
    if (!textString) return;

    const text = new window.Alphabet(this, 0, 0, textString.toUpperCase(), true, 1);
    text.x = (this.cameras.main.width / 2) - (text.width / 2);
    text.y = this.startY + this.currentYOffset;

    this.texts.push(text);
    this.currentYOffset += this.lineSpacing;
  }

  getRandomTextPair() {
    if (this.randomTextPairs.length === 0) return ["PART 1", "PART 2"];
    const randomIndex = Math.floor(Math.random() * this.randomTextPairs.length);
    return this.randomTextPairs[randomIndex];
  }

  shutdown() {
    if (this.music) {
      this.music.stop();
      this.music.destroy();
      this.music = null;
    }

    this.texts.forEach((t) => t.destroy());
    this.texts = [];

    if (this.imageObj) {
      this.imageObj.destroy();
      this.imageObj = null;
    }

    this.introEvents = [];
    this.input.off('pointerdown');
  }
}

funkin.ui.intro.IntroTextScene = IntroTextScene;
window.game.scene.add("IntroTextScene", IntroTextScene);