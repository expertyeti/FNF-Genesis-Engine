class IntroDanceAnims {
  constructor() {
    // Usamos el namespace en lugar de window
    funkin.ui.intro.danceEventBus.on(
      "setup_animations",
      this.setupAnimations,
      this,
    );
    funkin.ui.intro.danceEventBus.on("play_confirm", this.playConfirm, this);
  }

  setupAnimations(scene) {
    const baseWidth = 1280;
    const width = scene.scale.width;
    const height = scene.scale.height;
    const offsetX = Math.max(0, (width - baseWidth) / 2);

    if (!scene.anims.exists("gf_dance_anim")) {
      const gfFrames = scene.textures.get("gfDance").getFrameNames();
      const filteredGf = gfFrames.filter((f) => f !== "__BASE").sort();
      scene.anims.create({
        key: "gf_dance_anim",
        frames: filteredGf.map((frameName) => ({
          key: "gfDance",
          frame: frameName,
        })),
        frameRate: 24,
        repeat: -1,
      });
    }

    if (!scene.anims.exists("logo_bump_anim")) {
      const logoFrames = scene.textures.get("logoBumpin").getFrameNames();
      const filteredLogo = logoFrames.filter((f) => f !== "__BASE").sort();
      scene.anims.create({
        key: "logo_bump_anim",
        frames: filteredLogo.map((frameName) => ({
          key: "logoBumpin",
          frame: frameName,
        })),
        frameRate: 24,
        repeat: -1,
      });
    }

    const isMobile = !scene.sys.game.device.os.desktop;
    const targetEnterKey = isMobile ? "titleEnter_mobile" : "titleEnter";
    const enterKey = scene.textures.exists(targetEnterKey)
      ? targetEnterKey
      : "titleEnter";

    const idleAnimKey = `enter_idle_anim_${enterKey}`;
    const pressedAnimKey = `enter_pressed_anim_${enterKey}`;

    if (
      !scene.anims.exists(idleAnimKey) ||
      !scene.anims.exists(pressedAnimKey)
    ) {
      const enterFrames = scene.textures
        .get(enterKey)
        .getFrameNames()
        .filter((f) => f !== "__BASE")
        .sort();

      if (!scene.anims.exists(idleAnimKey)) {
        const enterIdleFrames = enterFrames.filter(
          (f) => !f.includes("PRESSED"),
        );
        scene.anims.create({
          key: idleAnimKey,
          frames: enterIdleFrames.map((frameName) => ({
            key: enterKey,
            frame: frameName,
          })),
          frameRate: 24,
          repeat: -1,
        });
      }

      if (!scene.anims.exists(pressedAnimKey)) {
        const enterPressedFrames = enterFrames.filter((f) =>
          f.includes("PRESSED"),
        );
        if (enterPressedFrames.length > 0) {
          scene.anims.create({
            key: pressedAnimKey,
            frames: enterPressedFrames.map((frameName) => ({
              key: enterKey,
              frame: frameName,
            })),
            frameRate: 24,
            repeat: -1,
          });
        }
      }
    }

    scene.logo = scene.add
      .sprite(-150 + offsetX, -100, "logoBumpin")
      .setOrigin(0, 0);
    scene.logo.play("logo_bump_anim");

    scene.gf = scene.add
      .sprite(512 + offsetX, height * 0.07, "gfDance")
      .setOrigin(0, 0);
    scene.gf.play("gf_dance_anim");

    const titleX = (isMobile ? 50 : 100) + offsetX;
    scene.titleText = scene.add
      .sprite(titleX, height * 0.8, enterKey)
      .setOrigin(0, 0);
    scene.titleText.play(idleAnimKey);

    this.titleText = scene.titleText;
    this.enterAnimKey = pressedAnimKey;
  }

  playConfirm() {
    if (this.titleText && this.titleText.scene) {
      this.titleText.play(this.enterAnimKey);
    }
  }
}

funkin.ui.intro.introDanceAnims = new IntroDanceAnims();
