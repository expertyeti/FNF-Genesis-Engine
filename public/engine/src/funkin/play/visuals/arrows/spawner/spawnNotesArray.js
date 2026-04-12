/**
 * @file src/funkin/play/visuals/arrows/spawner/spawnNotesArray.js
 */
window.funkin = window.funkin || {};
window.funkin.play = window.funkin.play || {};
window.funkin.play.visuals = window.funkin.play.visuals || {};
window.funkin.play.visuals.arrows = window.funkin.play.visuals.arrows || {};
window.funkin.play.visuals.arrows.spawner = window.funkin.play.visuals.arrows.spawner || {};

window.funkin.play.visuals.arrows.spawner.spawnNotesArray = function(
  scene, notesManager, chartNotesArray, assetKey, skinData, fallbackFrames
) {
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

    // --- FIX CRÍTICO: Prevenir el Truthy String Bug ---
    // En lugar de usar NoteDirection.isPlayerNote(p) que da 'true' para "op", 
    // verificamos explícitamente el texto.
    let isPlayer = false;
    let isOpponent = false;
    let isSpectator = false;

    if (typeof p === "string") {
      const pStr = p.toLowerCase();
      isPlayer = (pStr === "pl" || pStr === "player");
      isOpponent = (pStr === "op" || pStr === "opponent");
      isSpectator = (pStr === "sp" || pStr === "spectator");
    } else {
      // Respaldo de seguridad por si cargas un chart viejo (1 y 0)
      isPlayer = (p === 1 || p === true);
      isOpponent = (p === 0 || p === false);
    }

    const lane = NoteDirection ? NoteDirection.getBaseLane(dir) : dir % 4;
    const dirName = NoteDirection
      ? NoteDirection.getDirectionName(lane)
      : "left";
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

    if (scene.anims.exists(`${assetKey}_note_${dirName}`))
      note.play(`${assetKey}_note_${dirName}`);

    // Asignamos las variables de forma segura
    note.noteTime = time;
    note.pType = p; // Guardamos el "pl" u "op"
    note.isPlayer = isPlayer; // Variable 100% precisa ahora
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
};