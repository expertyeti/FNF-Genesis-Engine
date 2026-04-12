class HealthBarIcon {
  constructor(scene, healthBar, isPlayer) {
    this.scene = scene;
    this.healthBar = healthBar;
    this.isPlayer = isPlayer;

    this.sprite = scene.add.sprite(0, 0, null).setOrigin(0, 0);
    this.sprite.setDepth(101);
    this.sprite.setFlipX(this.isPlayer);

    this.currentIcon = null;
    this.POSITION_OFFSET = 26;
    this.iconOffset = [0, 0];

    this.baseScale = 1.0;
    this.currentScale = 1.0;
    this.isPixel = false;

    this.baseIconWidth = 150;
    this.baseIconHeight = 150;
  }

  update(healthLerp, delta = 16.6) {
    this.updateIconTexture();
    this.updateState(healthLerp);

    const lerpSpeed = 10.5;
    const lerpFactor = Math.min(1, (delta / 1000) * lerpSpeed);

    this.currentScale = Phaser.Math.Linear(this.currentScale, this.baseScale, lerpFactor);
    this.sprite.setScale(this.currentScale);

    this.updatePosition(healthLerp);
  }

  updateIconTexture() {
    let targetIcon = "icon_face";
    let targetScale = 1.0;
    let targetAntialiasing = true;
    let targetOffset = [0, 0];
    let targetType = "legacy";

    const charsData = funkin.play.characterLoader?.charactersData;

    if (charsData) {
      const charGroup = this.isPlayer ? charsData.players : charsData.opponents;

      if (charGroup && charGroup.length > 0) {
        const firstChar = charGroup[0];

        if (firstChar && firstChar.health) {
          const healthData = firstChar.health;

          if (healthData.id !== undefined) targetIcon = healthData.id;
          if (healthData.scale !== undefined) targetScale = healthData.scale;
          if (healthData.antialiasing !== undefined) targetAntialiasing = healthData.antialiasing;
          if (healthData.type !== undefined) targetType = healthData.type;
          if (healthData.offset !== undefined) targetOffset = healthData.offset;
        }
      }
    }

    this.baseScale = targetScale;
    this.isPixel = !targetAntialiasing;
    this.iconOffset = targetOffset;

    const iconKey = `icon_${targetIcon}`;

    if (this.currentIcon !== targetIcon) {
      this.currentIcon = targetIcon;

      if (this.scene.textures.exists(iconKey) && this.scene.textures.get(iconKey).key !== "__MISSING") {
        this.applyTexture(iconKey);
      } else {
        const iconUrl = `${window.BASE_URL}assets/images/icons/${targetIcon}.png`;
        this.scene.load.image(iconKey, iconUrl);

        const onComplete = () => {
          this.scene.load.off(`loaderror`, onError);
          if (this.currentIcon === targetIcon) {
            this.applyTexture(iconKey);
          }
        };

        const onError = (file) => {
          if (file.key === iconKey) {
            this.scene.load.off(`filecomplete-image-${iconKey}`, onComplete);
            console.warn(`Icon ${targetIcon} not found loading fallback face`);
            
            if (this.currentIcon === targetIcon) {
              this.applyTexture("face");
            }
          }
        };

        this.scene.load.once(`filecomplete-image-${iconKey}`, onComplete);
        this.scene.load.once(`loaderror`, onError);
        this.scene.load.start();
      }
    }
  }

  applyTexture(iconKey) {
    let tex = this.scene.textures.get(iconKey);
    
    if (!tex || tex.key === "__MISSING") {
      const fallbackKey = this.scene.textures.exists("face") ? "face" : "icon_face";
      tex = this.scene.textures.get(fallbackKey);
      iconKey = fallbackKey;
    }

    if (!tex || tex.key === "__MISSING") return;

    const img = tex.getSourceImage();
    if (!img) return;

    if (img.width >= img.height * 1.5) {
      this.baseIconWidth = img.width / 2;
      this.baseIconHeight = img.height;

      if (!tex.frames.hasOwnProperty("normal")) {
        tex.add("normal", 0, 0, 0, this.baseIconWidth, this.baseIconHeight);
      }
      if (!tex.frames.hasOwnProperty("losing")) {
        tex.add("losing", 0, this.baseIconWidth, 0, this.baseIconWidth, this.baseIconHeight);
      }
    } else {
      this.baseIconWidth = img.width;
      this.baseIconHeight = img.height;

      if (!tex.frames.hasOwnProperty("normal")) {
        tex.add("normal", 0, 0, 0, this.baseIconWidth, this.baseIconHeight);
      }
    }

    this.sprite.setTexture(iconKey);

    if (this.isPixel) {
      this.sprite.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    } else {
      this.sprite.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
    }

    if (this.sprite.texture.frames.hasOwnProperty("normal")) {
      this.sprite.setFrame("normal");
    }
  }

  updateState(healthLerp) {
    if (!this.sprite.texture) return;

    const maxHealth = funkin.PBOT && funkin.PBOT.Constants ? funkin.PBOT.Constants.HEALTH_MAX : 2.0;
    const percentHealth = healthLerp / maxHealth;

    let isLosing = false;

    if (this.isPlayer) {
      isLosing = percentHealth < 0.2;
    } else {
      isLosing = percentHealth > 0.8;
    }

    if (this.sprite.texture.frames.hasOwnProperty("losing")) {
      this.sprite.setFrame(isLosing ? "losing" : "normal");
    } else if (this.sprite.texture.frames.hasOwnProperty("normal")) {
      this.sprite.setFrame("normal");
    }
  }

  updatePosition(healthLerp) {
    if (!this.healthBar || !this.healthBar.bgSprite) return;

    const currentScaleX = this.sprite.scaleX;
    const currentScaleY = this.sprite.scaleY;

    const scaledWidth = this.baseIconWidth * currentScaleX;
    const scaledHeight = this.baseIconHeight * currentScaleY;

    const bg = this.healthBar.bgSprite;
    const barCenterY = bg.y;

    // Aquí no se invierte el offset en Y según lo solicitado
    this.sprite.y = barCenterY - scaledHeight / 2 + this.iconOffset[1];

    const maxHealth = funkin.PBOT && funkin.PBOT.Constants ? funkin.PBOT.Constants.HEALTH_MAX : 2.0;
    const percent = 1 - healthLerp / maxHealth;

    const barW = bg.width * bg.scaleX;
    const barLeftX = bg.x - barW / 2;
    const splitX = barLeftX + barW * percent;

    let anchorCenterX = 0;

    if (this.isPlayer) {
      anchorCenterX = splitX + this.baseIconWidth / 2 - this.POSITION_OFFSET;
    } else {
      anchorCenterX = splitX - this.baseIconWidth / 2 + this.POSITION_OFFSET;
    }

    let finalOffsetX = this.iconOffset[0];
    
    // Invertir ÚNICAMENTE el offset de X si el ícono está invertido (flipX)
    if (this.sprite.flipX) {
      finalOffsetX = -finalOffsetX;
    }

    this.sprite.x = anchorCenterX - scaledWidth / 2 + finalOffsetX;
  }

  bop() {
    this.currentScale = this.baseScale + 0.2;
  }
}

funkin.play.visuals.ui.HealthBarIcon = HealthBarIcon;