window.funkin = window.funkin || {};
window.funkin.play = window.funkin.play || {};
window.funkin.play.visuals = window.funkin.play.visuals || {};
window.funkin.play.visuals.arrows = window.funkin.play.visuals.arrows || {};
window.funkin.play.visuals.arrows.spawner = window.funkin.play.visuals.arrows.spawner || {};

window.funkin.play.visuals.arrows.spawner.createNoteFallbackFrames = function(scene, assetKey, prefixes) {
  const frameNames = scene.textures.get(assetKey).getFrameNames();
  const notesAPI = funkin.play.visuals.arrows.notes || {};
  const NoteDirection = window.funkin.NoteDirection || notesAPI.NoteDirection;

  const dirs = NoteDirection
    ? NoteDirection.getMappings().names
    : ["left", "down", "up", "right"];
  const fallbackFrames = {};

  const safePrefixes = prefixes || {};
  if (!prefixes)
    dirs.forEach(
      (d) =>
        (safePrefixes[d] = `note${d.charAt(0).toUpperCase() + d.slice(1)}`),
    );

  dirs.forEach((dir) => {
    const prefix = safePrefixes[dir];
    const animName = `${assetKey}_note_${dir}`;

    const matchingFrames = frameNames.filter(
      (name) => name && prefix && name.startsWith(prefix),
    );
    matchingFrames.sort();

    if (matchingFrames.length > 0) {
      fallbackFrames[dir] = matchingFrames[0];
      if (!scene.anims.exists(animName)) {
        scene.anims.create({
          key: animName,
          frames: matchingFrames.map((frame) => ({
            key: assetKey,
            frame: frame,
          })),
          frameRate: 24,
          repeat: matchingFrames.length > 1 ? -1 : 0,
        });
      }
    } else {
      fallbackFrames[dir] = frameNames[0];
    }
  });

  return fallbackFrames;
};