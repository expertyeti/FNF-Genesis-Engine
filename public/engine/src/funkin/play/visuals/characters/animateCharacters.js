/**
 * @file src/funkin/play/visuals/characters/animateCharacters.js
 * Manager in charge of animation logic and application of relative offsets.
 */
class AnimateCharacters {
  constructor(scene) {
    this.scene = scene;
    this.characters = [];
    this.subscribedToSustains = false;
    this.subscribedToNotes = false;
  }

  subscribeIfNeeded() {
    const sustainAPI = funkin.play.visuals.arrows.notes.SustainAPI;
    if (
      sustainAPI &&
      typeof sustainAPI.event === "function" &&
      !this.subscribedToSustains
    ) {
      const refreshHold = (d) => {
        this.characters.forEach((char) => {
          const isSpectator =
            char.role.includes("gf") ||
            char.role.includes("spectator") ||
            char.role.includes("girl");
          const isCharPlayer =
            !isSpectator &&
            (char.role.includes("player") ||
              char.role.includes("boyfriend") ||
              char.role.includes("bf"));
          const isCharOpponent =
            !isSpectator &&
            (char.role.includes("enemy") ||
              char.role.includes("opponent") ||
              char.role.includes("dad") ||
              char.role.includes("boss"));

          if ((d.isPlayer && isCharPlayer) || (!d.isPlayer && isCharOpponent)) {
            const stepCrochet =
              funkin.conductor && funkin.conductor.stepCrochet
                ? funkin.conductor.stepCrochet
                : 100;
            char.holdTimer = Date.now() + stepCrochet * 4;
          }
        });
      };

      sustainAPI.event("sustainStart", refreshHold);
      sustainAPI.event("sustainActive", refreshHold);
      this.subscribedToSustains = true;
    }

    const notesAPI = funkin.play.visuals.arrows.notes;
    if (
      notesAPI &&
      typeof notesAPI.event === "function" &&
      !this.subscribedToNotes
    ) {
      notesAPI.event("noteMiss", (missData) => {
        this.playMiss(missData.isPlayer, missData.direction);
      });
      this.subscribedToNotes = true;
    }
  }

  addCharacter(role, sprite, charData) {
    if (!charData || !charData.animations) return;

    const roleLower = role.toLowerCase();
    const isSpectator =
      roleLower.includes("gf") ||
      roleLower.includes("spectator") ||
      roleLower.includes("girl");
    const isPlayer =
      !isSpectator &&
      (roleLower.includes("player") ||
        roleLower.includes("boyfriend") ||
        roleLower.includes("bf"));

    const shouldFlip = isPlayer !== !!charData.flip_x;
    sprite.setFlipX(shouldFlip);

    let animsDict = {};
    let offsetsMap = {};
    let exactAnimKeys = { danceLeft: null, danceRight: null, idle: null };

    const texKey = sprite.texture.key;
    const texture = this.scene.textures.get(texKey);
    if (!texture || texture.key === "__MISSING") return;

    const allFrames = texture
      .getFrameNames()
      .filter((name) => name !== "__BASE");

    charData.animations.forEach((animDef) => {
      const exactName = animDef.anim;
      const animKey = `${texKey}_${exactName}`;
      const prefix = animDef.name;

      let matchingFrames = allFrames.filter((f) => {
        if (!f.startsWith(prefix)) return false;
        const remainder = f.substring(prefix.length).trim();
        return /^\d*$/.test(remainder);
      });

      if (matchingFrames.length === 0) return;

      matchingFrames.sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
      );

      let animFrames = [];
      if (
        animDef.indices &&
        Array.isArray(animDef.indices) &&
        animDef.indices.length > 0
      ) {
        animFrames = animDef.indices.map((idx) => {
          return {
            key: texKey,
            frame: matchingFrames[idx] || matchingFrames[0],
          };
        });
      } else {
        animFrames = matchingFrames.map((f) => {
          return { key: texKey, frame: f };
        });
      }

      if (!this.scene.anims.exists(animKey)) {
        this.scene.anims.create({
          key: animKey,
          frames: animFrames,
          frameRate: animDef.fps !== undefined ? animDef.fps : 24,
          repeat: animDef.loop ? -1 : 0,
        });
      }

      animsDict[exactName] = animKey;

      let offX = 0,
        offY = 0;
      let offsetsArray = animDef.offsets || animDef.offset;
      if (
        offsetsArray &&
        Array.isArray(offsetsArray) &&
        offsetsArray.length >= 2
      ) {
        offX = offsetsArray[0];
        offY = offsetsArray[1];
      }
      offsetsMap[exactName] = [offX, offY];

      const lowerName = exactName.toLowerCase();
      if (lowerName === "danceleft") exactAnimKeys.danceLeft = exactName;
      if (lowerName === "danceright") exactAnimKeys.danceRight = exactName;
      if (lowerName === "idle") exactAnimKeys.idle = exactName;
    });

    this.characters.push({
      role: roleLower,
      sprite: sprite,
      baseX: sprite.baseX !== undefined ? sprite.baseX : sprite.x,
      baseY: sprite.baseY !== undefined ? sprite.baseY : sprite.y,
      currentAnimName: null,
      animsDict: animsDict,
      offsets: offsetsMap,
      exactAnimKeys: exactAnimKeys,
      isDancer: !!(exactAnimKeys.danceLeft && exactAnimKeys.danceRight),
      dancedRight: false,
      holdTimer: 0,
    });

    const newChar = this.characters[this.characters.length - 1];

    if (newChar.isDancer)
      this.playCharacterAnim(newChar, newChar.exactAnimKeys.danceLeft, false);
    else if (newChar.exactAnimKeys.idle)
      this.playCharacterAnim(newChar, newChar.exactAnimKeys.idle, false);
    else {
      const firstAnim = Object.keys(animsDict)[0];
      if (firstAnim) this.playCharacterAnim(newChar, firstAnim, false);
    }

    this.subscribeIfNeeded();
  }

  playCharacterAnim(char, animName, ignoreIfPlaying = false) {
    if (!animName || !char.sprite || char.sprite.active === false) return;

    const animKey = char.animsDict[animName];
    if (!animKey || !this.scene.anims.exists(animKey)) return;

    char.sprite.play(animKey, ignoreIfPlaying);
    const offset = char.offsets[animName] || [0, 0];

    const offX = offset[0];
    const offY = offset[1];

    char.sprite.x = char.baseX - offX;
    char.sprite.y = char.baseY - offY;
    char.currentAnimName = animName;
  }

  _triggerAnimForRole(isPlayerTarget, animName, holdPose = false) {
    this.characters.forEach((char) => {
      const isSpectator =
        char.role.includes("gf") ||
        char.role.includes("spectator") ||
        char.role.includes("girl");
      const isCharPlayer =
        !isSpectator &&
        (char.role.includes("player") ||
          char.role.includes("boyfriend") ||
          char.role.includes("bf"));
      const isCharOpponent =
        !isSpectator &&
        (char.role.includes("enemy") ||
          char.role.includes("opponent") ||
          char.role.includes("dad") ||
          char.role.includes("boss"));

      if (
        (isPlayerTarget && isCharPlayer) ||
        (!isPlayerTarget && isCharOpponent)
      ) {
        let exactName = null;
        const targetLower = animName.toLowerCase();

        for (let key in char.animsDict) {
          if (key.toLowerCase() === targetLower) {
            exactName = key;
            break;
          }
        }

        if (exactName) this.playCharacterAnim(char, exactName, false);
        if (holdPose) {
          const stepCrochet =
            funkin.conductor && funkin.conductor.stepCrochet
              ? funkin.conductor.stepCrochet
              : 100;
          char.holdTimer = Date.now() + stepCrochet * 4;
        }
      }
    });
  }

  _getDirString(direction) {
    const dirs = ["LEFT", "DOWN", "UP", "RIGHT"];
    if (typeof direction === "number") return dirs[direction] || "LEFT";
    else if (typeof direction === "string") return direction.toUpperCase();
    return "LEFT";
  }

  sing(isPlayer, direction) {
    this.subscribeIfNeeded();
    const dirStr = this._getDirString(direction);
    this._triggerAnimForRole(isPlayer, `sing${dirStr}`, true);
  }

  playMiss(isPlayer, direction) {
    this.subscribeIfNeeded();
    const dirStr = this._getDirString(direction);
    this._triggerAnimForRole(isPlayer, `sing${dirStr}miss`, true);
  }

  onBeat() {
    this.subscribeIfNeeded();
    const now = Date.now();

    this.characters.forEach((char) => {
      if (!char.sprite || char.sprite.active === false) return;

      const currentAnim = char.currentAnimName;
      const isAnimPlaying = char.sprite.anims && char.sprite.anims.isPlaying;
      const isMissAnim =
        currentAnim && currentAnim.toLowerCase().endsWith("miss");

      if (isMissAnim && isAnimPlaying) return;
      if (now < char.holdTimer) return;

      const isIdleOrDance =
        currentAnim === char.exactAnimKeys.idle ||
        currentAnim === char.exactAnimKeys.danceLeft ||
        currentAnim === char.exactAnimKeys.danceRight;

      if (!isIdleOrDance && isAnimPlaying) return;

      if (char.isDancer) {
        if (char.dancedRight) {
          this.playCharacterAnim(char, char.exactAnimKeys.danceLeft, true);
          char.dancedRight = false;
        } else {
          this.playCharacterAnim(char, char.exactAnimKeys.danceRight, true);
          char.dancedRight = true;
        }
      } else if (char.exactAnimKeys.idle) {
        this.playCharacterAnim(char, char.exactAnimKeys.idle, true);
      }
    });
  }

  destroy() {
    if (this.characters) {
      this.characters.forEach((char) => {
        char.sprite = null;
        char.animsDict = null;
        char.offsets = null;
        char.exactAnimKeys = null;
      });
    }
    this.characters = [];
    this.scene = null;
    this.subscribedToNotes = false;
    this.subscribedToSustains = false;
  }
}

funkin.play.visuals.characters.AnimateCharacters = AnimateCharacters;