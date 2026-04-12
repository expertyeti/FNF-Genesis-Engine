/**
 * @file StoryModeCharacterProps.js
 * Controla los sprites de los personajes que bailan en el Story Mode.
 */
class StoryModeCharacterProps {
  constructor(scene, dataManager) {
    this.scene = scene;
    this.dataManager = dataManager;
    this.characters = {};
    this.updateProps();
  }

  updateProps() {
    const currentWeek = this.dataManager.getCurrentWeek();
    const charsData =
      currentWeek && currentWeek.data && currentWeek.data.weekCharacters
        ? currentWeek.data.weekCharacters
        : null;

    const newCharacters = {};
    const screenWidth = this.scene.scale.width;

    if (
      charsData &&
      typeof charsData === "object" &&
      !Array.isArray(charsData)
    ) {
      Object.keys(charsData).forEach((charKey) => {
        const charInfo = charsData[charKey];
        const pathName =
          charInfo.path && charInfo.path.trim() !== ""
            ? charInfo.path
            : charKey;
        const texKey = `menu_char_${pathName}`;

        if (!this.scene.textures.exists(texKey)) return;

        const offsetX = charInfo.offsets ? charInfo.offsets[0] : 0;
        const offsetY = charInfo.offsets ? charInfo.offsets[1] : 0;

        let baseX = screenWidth / 2 - 100;
        const keyLower = charKey.toLowerCase();

        if (
          keyLower.includes("dad") ||
          keyLower.includes("opp") ||
          charKey === "0"
        )
          baseX = screenWidth * 0.25 - 100;
        else if (
          keyLower.includes("bf") ||
          keyLower.includes("boy") ||
          charKey === "1"
        )
          baseX = screenWidth * 0.5 - 100;
        else if (
          keyLower.includes("gf") ||
          keyLower.includes("girl") ||
          charKey === "2"
        )
          baseX = screenWidth * 0.75 - 100;

        const finalX = baseX + offsetX;
        const finalY = 50 + offsetY;

        if (
          this.characters[charKey] &&
          this.characters[charKey].texKey === texKey
        ) {
          const existingChar = this.characters[charKey];
          existingChar.sprite.setPosition(finalX, finalY);
          newCharacters[charKey] = existingChar;
          return;
        }

        const sprite = this.scene.add
          .sprite(finalX, finalY, texKey)
          .setOrigin(0, 0)
          .setDepth(1000);
        const animsDict = {};

        if (charInfo.animations) {
          const allFrames = this.scene.textures.get(texKey).getFrameNames();

          Object.keys(charInfo.animations).forEach((animKey) => {
            const animData = charInfo.animations[animKey];
            const fullAnimKey = `${texKey}_${animKey}`;
            animsDict[animKey] = fullAnimKey;

            if (!this.scene.anims.exists(fullAnimKey)) {
              let frames = [];
              if (animData.indices && animData.indices.length > 0) {
                frames = animData.indices
                  .map((i) => {
                    const targetName =
                      animData.prefix + String(i).padStart(4, "0");
                    return allFrames.includes(targetName)
                      ? { key: texKey, frame: targetName }
                      : null;
                  })
                  .filter((f) => f !== null);
              } else {
                frames = allFrames
                  .filter((f) => f.startsWith(animData.prefix))
                  .sort()
                  .map((f) => ({ key: texKey, frame: f }));
              }

              if (frames.length > 0) {
                this.scene.anims.create({
                  key: fullAnimKey,
                  frames: frames,
                  frameRate:
                    animData.frames !== undefined ? animData.frames : 24,
                  repeat: animData.loop ? -1 : 0,
                });
              }
            }

            if (
              animKey === "idle" ||
              animKey === "danceLeft" ||
              animKey === "danceRight"
            ) {
              if (animData.scale)
                sprite.setScale(animData.scale[0], animData.scale[1]);
              if (animData.flipX !== undefined) sprite.setFlipX(animData.flipX);
              if (animData.alpha !== undefined) sprite.setAlpha(animData.alpha);
              if (animData.visible !== undefined)
                sprite.setVisible(animData.visible);
            }
          });
        }

        newCharacters[charKey] = {
          sprite: sprite,
          texKey: texKey,
          anims: animsDict,
          dancedRight: false,
          isNew: true,
        };
      });
    }

    Object.keys(this.characters).forEach((oldKey) => {
      if (
        !newCharacters[oldKey] ||
        newCharacters[oldKey].sprite !== this.characters[oldKey].sprite
      ) {
        if (this.characters[oldKey].sprite)
          this.characters[oldKey].sprite.destroy();
      }
    });

    this.characters = newCharacters;

    Object.values(this.characters).forEach((char) => {
      if (char.isNew) {
        char.isNew = false;
        if (char.anims["danceRight"]) {
          char.dancedRight = true;
          char.sprite.play(char.anims["danceRight"]);
        } else if (char.anims["idle"]) {
          char.sprite.play(char.anims["idle"]);
        }
      }
    });
  }

  dance() {
    Object.values(this.characters).forEach((char) => {
      const { sprite, anims } = char;
      if (!sprite || !sprite.active || !sprite.anims) return;

      if (
        sprite.anims.currentAnim &&
        sprite.anims.currentAnim.key === anims["confirm"]
      )
        return;

      if (anims["danceLeft"] && anims["danceRight"]) {
        const animObj = this.scene.anims.get(anims["danceLeft"]);
        const isLooping = animObj && animObj.repeat === -1;

        if (isLooping) {
          if (!sprite.anims.isPlaying) sprite.play(anims["danceLeft"]);
        } else {
          char.dancedRight = !char.dancedRight;
          sprite.play(
            char.dancedRight ? anims["danceRight"] : anims["danceLeft"],
          );
        }
      } else if (anims["idle"]) {
        const animObj = this.scene.anims.get(anims["idle"]);
        const isLooping = animObj && animObj.repeat === -1;

        if (isLooping) {
          if (
            !sprite.anims.isPlaying ||
            sprite.anims.currentAnim.key !== anims["idle"]
          ) {
            sprite.play(anims["idle"]);
          }
        } else {
          sprite.play(anims["idle"], true);
          sprite.anims.restart();
        }
      }
    });
  }

  playConfirm() {
    Object.values(this.characters).forEach((char) => {
      const { sprite, anims } = char;
      if (sprite && sprite.active && sprite.anims && anims["confirm"]) {
        sprite.play(anims["confirm"], true);
      }
    });
  }

  destroy() {
    Object.values(this.characters).forEach((c) => {
      if (c.sprite) c.sprite.destroy();
    });
    this.characters = {};
  }
}

funkin.ui.storyMode.StoryModeCharacterProps = StoryModeCharacterProps;
