/**
 * @file ArrowsSpawner.js
 * Clase responsable de instanciar y organizar visualmente los strums, fondos y notas en pantalla.
 */

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.arrows = funkin.play.visuals.arrows || {};

class ArrowsSpawner {
  static clearExisting(scene) {
    if (scene.strumlines) {
      scene.strumlines.destroy();
      scene.strumlines = null;
    }
    if (scene.notesManager) {
      scene.notesManager.destroy();
      scene.notesManager = null;
    }

    const notesAPI = funkin.play.visuals.arrows.notes;
    if (notesAPI && typeof notesAPI.emit === "function") {
      notesAPI._listeners = {};
      notesAPI._globalListeners = [];
    }

    const strumlinesAPI = funkin.play.visuals.arrows.strumlines;
    if (strumlinesAPI && typeof strumlinesAPI.emit === "function") {
      strumlinesAPI._listeners = {};
      strumlinesAPI._globalListeners = [];
    }
  }

  static spawnStrumlines(scene, strumlines) {
    if (!funkin.play || !funkin.play.uiSkins || !funkin.play.session) return;

    const skinData = funkin.play.uiSkins.get("gameplay.strumline");
    if (!skinData) return;

    const assetKey = funkin.play.uiSkins.getAssetKey(skinData.assetPath);
    if (!scene.textures.exists(assetKey)) return;

    this.checkSparrowXML(scene, assetKey);
    this.createStrumAnimations(scene, assetKey, skinData.animations, strumlines.directions);

    const scale = skinData.scale !== undefined ? skinData.scale : 0.7;
    const alpha = skinData.alpha !== undefined ? skinData.alpha : 1.0;

    strumlines.opponentBg = scene.add.rectangle(0, 0, 10, 10, 0x000000, 0.5);
    strumlines.opponentBg.setOrigin(0, 0);
    strumlines.opponentBg.setDepth(1950);

    if (funkin.play.data.camera && funkin.play.data.camera.addObjToUI) {
      funkin.play.data.camera.addObjToUI(strumlines.opponentBg);
    } else {
      strumlines.opponentBg.setScrollFactor(0);
    }

    strumlines.playerBg = scene.add.rectangle(0, 0, 10, 10, 0x000000, 0.5);
    strumlines.playerBg.setOrigin(0, 0);
    strumlines.playerBg.setDepth(1950);

    if (funkin.play.data.camera && funkin.play.data.camera.addObjToUI) {
      funkin.play.data.camera.addObjToUI(strumlines.playerBg);
    } else {
      strumlines.playerBg.setScrollFactor(0);
    }

    for (let i = 0; i < strumlines.keyCount; i++) {
      const dir = strumlines.directions[i];

      const oppArrow = this.createArrow(scene, strumlines, 0, 0, assetKey, scale, alpha, dir, skinData, false);
      strumlines.opponentStrums.push(oppArrow);

      const playerArrow = this.createArrow(scene, strumlines, 0, 0, assetKey, scale, alpha, dir, skinData, true);
      strumlines.playerStrums.push(playerArrow);
    }

    const strumlinesNamespace = funkin.play.visuals.arrows.strumlines || {};
    if (strumlinesNamespace.StrumlineLayout) {
      strumlinesNamespace.StrumlineLayout.updateLayout(strumlines);
    }
  }

  static createArrow(scene, strumlines, x, y, assetKey, scale, alpha, dir, skinData, isPlayer) {
    const arrow = scene.add.sprite(x, y, assetKey);

    arrow.setScale(scale);
    arrow.setAlpha(alpha);
    arrow.setOrigin(0, 0);
    arrow.setDepth(2000);

    if (funkin.play.data.camera && funkin.play.data.camera.addObjToUI) {
      funkin.play.data.camera.addObjToUI(arrow);
    } else {
      arrow.setScrollFactor(0);
    }

    arrow.direction = dir;
    arrow.isPlayer = isPlayer;
    arrow.baseX = x;
    arrow.baseY = y;
    arrow.baseAlpha = alpha;
    arrow.baseScale = scale;
    arrow.currentAction = "static";
    arrow.resetTime = 0;
    arrow.animsOffsets = skinData.offsets || { static: [0, 0], press: [0, 0], confirm: [0, 0] };

    const strumlinesNamespace = funkin.play.visuals.arrows.strumlines || {};
    if (strumlinesNamespace.StrumlineAnimator) {
      strumlinesNamespace.StrumlineAnimator.assignPlayAnimFunction(arrow, assetKey);
    }

    arrow.playAnim("static", true);
    return arrow;
  }

  static createStrumAnimations(scene, assetKey, animsData, directions) {
    const frameNames = scene.textures.get(assetKey).getFrameNames();

    directions.forEach((dir) => {
      const dirAnims = animsData[dir];
      if (!dirAnims) return;

      Object.keys(dirAnims).forEach((animType) => {
        const prefixToSearch = dirAnims[animType];
        const animName = `${assetKey}_strum_${animType}_${dir}`;

        if (scene.anims.exists(animName)) return;

        const matchingFrames = frameNames.filter((name) => name.startsWith(prefixToSearch));
        matchingFrames.sort();

        if (matchingFrames.length > 0) {
          scene.anims.create({
            key: animName,
            frames: matchingFrames.map((frame) => ({ key: assetKey, frame: frame })),
            frameRate: 24,
            repeat: 0,
          });
        }
      });
    });
  }

  static spawnChartNotes(scene, notesManager) {
    if (!funkin.play || !funkin.play.uiSkins || !funkin.play.session || !funkin.play.chart) return;

    const skinData = funkin.play.uiSkins.get("gameplay.notes");
    const chartData = funkin.play.chart.get("notes");

    if (!skinData || !chartData || !Array.isArray(chartData) || chartData.length === 0) return;

    const assetKey = funkin.play.uiSkins.getAssetKey(skinData.assetPath);
    if (!scene.textures.exists(assetKey)) return;

    this.checkSparrowXML(scene, assetKey);

    const fallbackFrames = this.createNoteFallbackFrames(scene, assetKey, skinData.animations);
    this.spawnNotesArray(scene, notesManager, chartData, assetKey, skinData, fallbackFrames);
  }

  static spawnNotesArray(scene, notesManager, chartNotesArray, assetKey, skinData, fallbackFrames) {
    const scale = skinData.scale !== undefined ? skinData.scale : 0.7;
    const alpha = skinData.alpha !== undefined ? skinData.alpha : 1.0;
    const skinOffset = skinData.Offset || [0, 0];
    const universalFallbackFrame = scene.textures.get(assetKey).getFrameNames()[0];

    // Resolución segura de NoteDirection
    const notesAPI = funkin.play.visuals.arrows.notes || {};
    const NoteDirection = window.funkin.NoteDirection || notesAPI.NoteDirection;

    chartNotesArray.forEach((noteData) => {
      const time = noteData.t;
      const dir = noteData.d;
      const p = noteData.p;
      const length = noteData.l;
      const kind = noteData.k;

      const isPlayer = NoteDirection ? NoteDirection.isPlayerNote(p) : false;
      const lane = NoteDirection ? NoteDirection.getBaseLane(dir) : dir % 4;
      const dirName = NoteDirection ? NoteDirection.getDirectionName(lane) : "left";
      const frameToUse = fallbackFrames[dirName] || universalFallbackFrame;

      const note = scene.add.sprite(-5000, -5000, assetKey, frameToUse);
      note.setScale(scale);
      note.setAlpha(alpha);
      note.setOrigin(0, 0);
      note.setDepth(2500);

      if (funkin.play.data.camera && funkin.play.data.camera.addObjToUI) {
        funkin.play.data.camera.addObjToUI(note);
      } else {
        note.setScrollFactor(0);
      }

      if (scene.anims.exists(`${assetKey}_note_${dirName}`)) note.play(`${assetKey}_note_${dirName}`);

      note.noteTime = time;
      note.isPlayer = isPlayer;
      note.lane = lane;
      note.length = length;
      note.kind = kind;
      note.skinOffset = skinOffset;

      note.baseAlpha = alpha;
      note.baseScale = scale;
      note.hasMissed = false;
      note.wasHit = false;
      note.active = true;

      notesManager.notes.push(note);

      if (notesAPI && typeof notesAPI.emit === "function") {
        notesAPI.emit("spawn", { note: note });
      }
    });

    notesManager.notes.sort((a, b) => a.noteTime - b.noteTime);

    if (notesAPI && typeof notesAPI.emit === "function") {
      notesAPI.emit("allLoaded", { total: notesManager.notes.length });
    }
  }

  static createNoteFallbackFrames(scene, assetKey, prefixes) {
    const frameNames = scene.textures.get(assetKey).getFrameNames();
    
    // Resolución segura de NoteDirection
    const notesAPI = funkin.play.visuals.arrows.notes || {};
    const NoteDirection = window.funkin.NoteDirection || notesAPI.NoteDirection;
    
    const dirs = NoteDirection ? NoteDirection.getMappings().names : ["left", "down", "up", "right"];
    const fallbackFrames = {};

    const safePrefixes = prefixes || {};
    if (!prefixes) dirs.forEach((d) => (safePrefixes[d] = `note${d.charAt(0).toUpperCase() + d.slice(1)}`));

    dirs.forEach((dir) => {
      const prefix = safePrefixes[dir];
      const animName = `${assetKey}_note_${dir}`;

      const matchingFrames = frameNames.filter((name) => name && prefix && name.startsWith(prefix));
      matchingFrames.sort();

      if (matchingFrames.length > 0) {
        fallbackFrames[dir] = matchingFrames[0];
        if (!scene.anims.exists(animName)) {
          scene.anims.create({
            key: animName,
            frames: matchingFrames.map((frame) => ({ key: assetKey, frame: frame })),
            frameRate: 24,
            repeat: matchingFrames.length > 1 ? -1 : 0,
          });
        }
      } else {
        fallbackFrames[dir] = frameNames[0];
      }
    });

    return fallbackFrames;
  }

  static checkSparrowXML(scene, assetKey) {
    if (funkin.utils && funkin.utils.animations && funkin.utils.animations.sparrow && funkin.utils.animations.sparrow.SparrowParser) {
      const xmlText = scene.cache.text.get(`${assetKey}_rawXML`);
      if (xmlText) {
        funkin.utils.animations.sparrow.SparrowParser.fixPhaserSparrow(scene, assetKey, xmlText);
        const tex = scene.textures.get(assetKey);
        if (tex && tex.source) tex.source.forEach((s) => s.update());
      }
    }
  }
}

funkin.play.visuals.arrows.ArrowsSpawner = ArrowsSpawner;