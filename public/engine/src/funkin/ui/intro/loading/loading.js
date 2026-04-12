class Loading extends Phaser.Scene {
  constructor() {
    super("Loading");
  }

  init() {
    const fontStyle = document.createElement("style");
    fontStyle.type = "text/css";
    fontStyle.textContent = `
      @font-face {
        font-family: 'VCR';
        src: url('${window.BASE_URL}assets/fonts/vcr.ttf') format('truetype');
      }
    `;
    document.head.appendChild(fontStyle);
  }

  preload() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    this.load.imageBitmapFormat = true;

    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const progressBar = this.add.graphics();

    const loadingText = this.add
      .text(width / 2, height / 2 - 50, "LOADING...", {
        fontFamily: "VCR, monospace",
        fontSize: "32px",
        fill: "#FFFFFF",
      })
      .setOrigin(0.5);

    const percentText = this.add
      .text(width / 2, height / 2, "0%", {
        fontFamily: "VCR, monospace",
        fontSize: "18px",
        fill: "#FFFFFF",
      })
      .setOrigin(0.5);

    this.load.on("progress", (value) => {
      funkin.ui.loading.percent = value;
      percentText.setText(parseInt(value * 100) + "%");
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    this.load.on("complete", () => {
      funkin.ui.loading.isComplete = true;
      console.log("Carga al 100% - Assets listos.");
    });

    window.Alphabet.load(this);
    this.load.json("introData", window.BASE_URL + "assets/data/ui/intro.json");
    this.load.audio(
      "freakyMenu",
      window.BASE_URL + "assets/music/FreakyMenu.mp3",
    );
    this.load.image(
      "newgrounds",
      window.BASE_URL + "assets/images/menu/intro/newgrounds_logo.png",
    );
    this.load.text(
      "randomText",
      window.BASE_URL + "assets/data/ui/randomText.txt",
    );
    this.load.atlasXML(
      "gfDance",
      window.BASE_URL + "assets/images/menu/intro/gfDanceTitle.png",
      window.BASE_URL + "assets/images/menu/intro/gfDanceTitle.xml",
    );
    this.load.atlasXML(
      "logoBumpin",
      window.BASE_URL + "assets/images/menu/intro/logoBumpin.png",
      window.BASE_URL + "assets/images/menu/intro/logoBumpin.xml",
    );
    this.load.atlasXML(
      "titleEnter",
      window.BASE_URL + "assets/images/menu/intro/titleEnter.png",
      window.BASE_URL + "assets/images/menu/intro/titleEnter.xml",
    );
  }

  create() {
    this.children.removeAll();
    this.scene.start("IntroTextScene");
  }
}

funkin.ui.loading.LoadingScene = Loading;
game.scene.add("Loading", Loading, true);
