/**
 * @file ArrowsSpawner.js
 * Clase centralizada que contiene toda la lógica de instanciación de notas y strumlines.
 * (Sustituye por completo al antiguo ArrowsData.js y ArrowsSpawner.js)
 */

window.funkin = window.funkin || {};
window.funkin.play = window.funkin.play || {};
window.funkin.play.visuals = window.funkin.play.visuals || {};
window.funkin.play.visuals.arrows = window.funkin.play.visuals.arrows || {};

class ArrowsSpawner {
  // ============================================================================
  // UTILIDADES Y CÁLCULOS
  // ============================================================================
  static calculateOptimalPoolSize(chartData, screenHeight, scrollSpeed, scrollConstant = 0.45, safetyMargin = 1.15) {
    if (!chartData || !Array.isArray(chartData) || chartData.length === 0) return 0;

    const V = screenHeight / (scrollSpeed * scrollConstant);
    let left = 0;
    let maxNotesInWindow = 0;

    for (let right = 0; right < chartData.length; right++) {
      while (left < right && chartData[right].t - chartData[left].t > V) {
        left++;
      }
      const notesInCurrentWindow = right - left + 1;
      maxNotesInWindow = Math.max(maxNotesInWindow, notesInCurrentWindow);
    }

    return Math.ceil(maxNotesInWindow * safetyMargin);
  }

  static checkSparrowXML(scene, assetKey) {
    if (funkin.utils?.animations?.sparrow?.SparrowParser) {
      const xmlText = scene.cache.text.get(`${assetKey}_rawXML`);
      if (xmlText) {
        funkin.utils.animations.sparrow.SparrowParser.fixPhaserSparrow(scene, assetKey, xmlText);
        const tex = scene.textures.get(assetKey);
        if (tex && tex.source) tex.source.forEach((s) => s.update());
      }
    }
  }

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

    const strumlinesAPI = funkin.play.visuals.arrows.strumelines;
    if (strumlinesAPI && typeof strumlinesAPI.emit === "function") {
      strumlinesAPI._listeners = {};
      strumlinesAPI._globalListeners = [];
    }
  }

  // ============================================================================
  // CREACIÓN DE ANIMACIONES Y FRAMES
  // ============================================================================
  static createNoteFallbackFrames(scene, assetKey, prefixes) {
    const frameNames = scene.textures.get(assetKey).getFrameNames();
    const notesAPI = funkin.play.visuals.arrows.notes || {};
    const NoteDirection = window.funkin.NoteDirection || notesAPI.NoteDirection;

    const dirs = NoteDirection ? NoteDirection.getMappings().names : ["left", "down", "up", "right"];
    const fallbackFrames = {};
    const safePrefixes = prefixes || {};

    if (!prefixes) {
      dirs.forEach((d) => (safePrefixes[d] = `note${d.charAt(0).toUpperCase() + d.slice(1)}`));
    }

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

  static createStrumAnimations(scene, assetKey, animsData, directions) {
    const frameNames = scene.textures.get(assetKey).getFrameNames();
    // 🚨 FALLBACK PROTECTOR EXTRA por si directions vuelve a ser falsy
    const safeDirections = directions || ["left", "down", "up", "right"];

    safeDirections.forEach((dir) => {
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

    // Si la inyección del animador en prototipos funcionó, esto tal vez no sea estrictamente necesario,
    // pero lo dejamos por seguridad si algo lo llama de forma externa.
    const strumlinesNamespace = funkin.play.visuals.arrows.strumelines || {};
    if (strumlinesNamespace.Strumlines && strumlinesNamespace.Strumlines.prototype.setupAnimator) {
        strumlinesNamespace.Strumlines.prototype.setupAnimator.call({scene: scene}, arrow);
    }

    if (typeof arrow.playAnim === 'function') {
        arrow.playAnim("static", true);
    }
    
    return arrow;
  }

  // ============================================================================
  // LÓGICA DE SPAWN (GENERACIÓN)
  // ============================================================================
  static spawnNotesArray(scene, notesManager, chartNotesArray, assetKey, skinData, fallbackFrames) {
    const scale = skinData.scale !== undefined ? skinData.scale : 0.7;
    const alpha = skinData.alpha !== undefined ? skinData.alpha : 1.0;
    const skinOffset = skinData.Offset || [0, 0];
    const universalFallbackFrame = scene.textures.get(assetKey).getFrameNames()[0];

    const notesAPI = funkin.play.visuals.arrows.notes || {};
    const NoteDirection = window.funkin.NoteDirection || notesAPI.NoteDirection;

    chartNotesArray.forEach((noteData) => {
      const time = noteData.t;
      const dir = noteData.d;
      const p = noteData.p; 
      const length = noteData.l;
      const kind = noteData.k;

      let isPlayer = false;
      let isOpponent = false;
      let isSpectator = false;

      if (typeof p === "string") {
        const pStr = p.toLowerCase();
        isPlayer = (pStr === "pl" || pStr === "player");
        isOpponent = (pStr === "op" || pStr === "opponent");
        isSpectator = (pStr === "sp" || pStr === "spectator");
      } else {
        isPlayer = (p === 1 || p === true);
        isOpponent = (p === 0 || p === false);
      }

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

      if (scene.anims.exists(`${assetKey}_note_${dirName}`)) {
        note.play(`${assetKey}_note_${dirName}`);
      }

      note.noteTime = time;
      note.pType = p; 
      note.isPlayer = isPlayer; 
      note.isOpponent = isOpponent;
      note.isSpectator = isSpectator;
      
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

  static spawnChartNotes(scene, notesManager) {
    if (!funkin.play || !funkin.play.uiSkins || !funkin.play.session || !funkin.play.chart) return;

    const skinData = funkin.play.uiSkins.get("gameplay.notes");
    const chartData = funkin.play.chart.get("notes");

    if (!skinData || !chartData || !Array.isArray(chartData) || chartData.length === 0) return;

    const assetKey = funkin.play.uiSkins.getAssetKey(skinData.assetPath);
    if (!scene.textures.exists(assetKey)) return;

    ArrowsSpawner.checkSparrowXML(scene, assetKey);

    const screenHeight = scene.scale.height || 720;
    const scrollSpeed = notesManager.scrollSpeed || 1.0;
    const optimalPoolSize = ArrowsSpawner.calculateOptimalPoolSize(chartData, screenHeight, scrollSpeed);

    if (notesManager.poolSize === undefined) {
      notesManager.poolSize = optimalPoolSize;
    }

    const fallbackFrames = ArrowsSpawner.createNoteFallbackFrames(scene, assetKey, skinData.animations);
    
    ArrowsSpawner.spawnNotesArray(scene, notesManager, chartData, assetKey, skinData, fallbackFrames);
  }

  static spawnStrumlines(scene, strumlines) {
    if (!funkin.play || !funkin.play.uiSkins || !funkin.play.session) return;

    const skinData = funkin.play.uiSkins.get("gameplay.strumline");
    if (!skinData) return;

    const assetKey = funkin.play.uiSkins.getAssetKey(skinData.assetPath);
    if (!scene.textures.exists(assetKey)) return;

    ArrowsSpawner.checkSparrowXML(scene, assetKey);
    ArrowsSpawner.createStrumAnimations(scene, assetKey, skinData.animations, strumlines.directions);

    // En nuestra nueva clase Strumlines (monolítica) la propia clase instancia los
    // strums (sprites y texturas) vía this.initStrums(). Así que solo delegamos:
    if (typeof strumlines.initStrums === 'function') {
        // En StrumlinesRenderer los inicializa y posiciona.
        // Si ya están inicializados, podemos omitir este paso, pero para
        // asegurar consistencia con el viejo Spawner:
        if (strumlines.opponentStrums.length === 0) {
            strumlines.initStrums();
        }
    }
    
    // Y finalmente aplicamos el layout (espaciado y posiciones)
    if (typeof strumlines.applyLayout === 'function') {
        strumlines.applyLayout();
    }
  }
}

funkin.play.visuals.arrows.ArrowsSpawner = ArrowsSpawner;