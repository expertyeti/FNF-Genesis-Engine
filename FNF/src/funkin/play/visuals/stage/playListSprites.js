class PlayListSprites {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene = scene; // Escena principal
    this.sprites = []; // Lista de objetos administrados
  }

  /**
   * @param {Phaser.GameObjects.Sprite|Object} sprite
   * @param {Object} animationData
   * @param {string} baseKey
   * @param {boolean} isAtlas
   */
  add(sprite, animationData, baseKey, isAtlas = false) {
    if (!animationData) return;

    let animKeys = []; // Llaves validadas de animación
    const playMode = String(animationData.play_mode || "none")
      .toLowerCase()
      .trim();

    if (isAtlas) {
      let animsList =
        sprite.animations instanceof Map
          ? Array.from(sprite.animations.values())
          : sprite.animations || [];

      if (animationData.play_list) {
        // Parseo robusto y tolerante a Arrays u Objetos JSON
        let playListArray = Array.isArray(animationData.play_list)
          ? animationData.play_list
          : Object.keys(animationData.play_list).map((k) => ({
              name: k,
              ...animationData.play_list[k],
            }));

        animKeys = playListArray
          .map((dataAnim) => {
            let animName = dataAnim.name || dataAnim.anim;
            if (animsList.find((a) => a.name === animName)) return animName;

            let prefix = dataAnim.prefix || animName;
            let match = animsList.find(
              (a) => a.prefix === prefix || a.name === prefix,
            );
            if (match) return match.name;

            return animName;
          })
          .filter(Boolean);
      } else {
        // Síntesis de llaves si el Atlas se declaró sin play_list explícito
        if (animsList.length > 0) {
          animKeys = [animsList[0].name];
        } else {
          animKeys = ["default"];
        }
      }
    } else {
      if (!animationData.play_list) return; // Sprites nativos requieren rigurosamente un play_list
      animKeys = Object.keys(animationData.play_list).map(
        (k) => `${baseKey}_${k}`,
      );
    }

    if (animKeys.length === 0) return;

    // Tolerancia a números directos o arrays para el Beat
    let beatInterval = 1;
    if (typeof animationData.beat === "number") {
      beatInterval = animationData.beat;
    } else if (
      Array.isArray(animationData.beat) &&
      animationData.beat.length > 0
    ) {
      beatInterval = animationData.beat[0];
    }

    if (animationData.frameRate && isAtlas) {
      sprite.currentFps = animationData.frameRate;
    }

    // Para animaciones atlas con varias entradas en play_list + beat, habilitamos ciclo por beat
    let effectivePlayMode = playMode;
    if (playMode === "loop" && animKeys.length > 1 && beatInterval > 0) {
      effectivePlayMode = "beat";
    }

    const item = {
      sprite: sprite,
      playMode: effectivePlayMode,
      beatInterval: beatInterval,
      animKeys: animKeys,
      currentIndex: 0,
      isAtlas: isAtlas,
    };

    this.sprites.push(item);

    if (item.playMode === "none") {
      if (isAtlas) {
        if (sprite.stop) sprite.stop();
        sprite.play(animKeys[0], true);
        if (sprite.stop) sprite.stop(); // Seguro doble para pausar render
      } else {
        sprite.play({ key: animKeys[0], repeat: 0 }, false);
        sprite.stop();
      }
    } else if (item.playMode === "loop") {
      if (isAtlas) {
        sprite.play(animKeys[0], false);
      } else {
        sprite.play({ key: animKeys[0], repeat: -1 }, false);
      }
    } else if (item.playMode === "onetime") {
      this.playOneTimeSeq(item);
    } else if (item.playMode === "beat") {
      if (isAtlas) {
        sprite.play(animKeys[0], false);
      } else {
        sprite.stop();
        sprite.play({ key: animKeys[0], repeat: 0 }, false);
      }
    }
  }

  /**
   * @param {Object} item
   */
  playOneTimeSeq(item) {
    let idx = 0; // Índice secuencial actual

    if (item.isAtlas) {
      item.sprite.play(item.animKeys[idx], false);
    } else {
      item.sprite.stop();
      item.sprite.play({ key: item.animKeys[idx], repeat: 0 }, false);
    }

    const onComplete = (anim) => {
      const animName = typeof anim === "string" ? anim : anim.key || anim.name;
      const isMatch = animName === item.animKeys[idx];

      if (isMatch) {
        idx++;
        if (idx < item.animKeys.length) {
          if (item.isAtlas) {
            item.sprite.play(item.animKeys[idx], false);
          } else {
            item.sprite.stop();
            item.sprite.play({ key: item.animKeys[idx], repeat: 0 }, false);
          }
        } else {
          item.sprite.off("animationcomplete", onComplete);
        }
      }
    };

    item.sprite.on("animationcomplete", onComplete);
  }

  /**
   * @param {number} currentBeat
   */
  onBeat(currentBeat) {
    this.sprites.forEach((item) => {
      if (item.playMode === "beat" && item.animKeys.length > 0) {
        if (currentBeat % item.beatInterval === 0) {
          if (item.isAtlas) {
            if (item.sprite.stop) item.sprite.stop(); // Fuerza absoluta de reinicio para Animate Timeline
            item.sprite.play(item.animKeys[item.currentIndex], false);
          } else {
            item.sprite.stop();
            item.sprite.play(
              { key: item.animKeys[item.currentIndex], repeat: 0 },
              false,
            );
          }
          item.currentIndex = (item.currentIndex + 1) % item.animKeys.length;
        }
      }
    });
  }

  destroy() {
    this.sprites = [];
    this.scene = null;
  }
}

funkin.play = funkin.play || {};
funkin.play.PlayListSprites = PlayListSprites;
