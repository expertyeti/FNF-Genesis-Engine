window.funkin = window.funkin || {};
window.funkin.play = window.funkin.play || {};
window.funkin.play.visuals = window.funkin.play.visuals || {};
window.funkin.play.visuals.arrows = window.funkin.play.visuals.arrows || {};
window.funkin.play.visuals.arrows.spawner = window.funkin.play.visuals.arrows.spawner || {};

window.funkin.play.visuals.arrows.spawner.checkSparrowXML = function(scene, assetKey) {
  if (
    funkin.utils &&
    funkin.utils.animations &&
    funkin.utils.animations.sparrow &&
    funkin.utils.animations.sparrow.SparrowParser
  ) {
    const xmlText = scene.cache.text.get(`${assetKey}_rawXML`);
    if (xmlText) {
      funkin.utils.animations.sparrow.SparrowParser.fixPhaserSparrow(
        scene,
        assetKey,
        xmlText,
      );
      const tex = scene.textures.get(assetKey);
      if (tex && tex.source) tex.source.forEach((s) => s.update());
    }
  }
};