window.funkin = window.funkin || {};
window.funkin.play = window.funkin.play || {};
window.funkin.play.visuals = window.funkin.play.visuals || {};
window.funkin.play.visuals.arrows = window.funkin.play.visuals.arrows || {};
window.funkin.play.visuals.arrows.spawner = window.funkin.play.visuals.arrows.spawner || {};

window.funkin.play.visuals.arrows.spawner.createArrow = function(
  scene, strumlines, x, y, assetKey, scale, alpha, dir, skinData, isPlayer
) {
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
  arrow.animsOffsets = skinData.offsets || {
    static: [0, 0],
    press: [0, 0],
    confirm: [0, 0],
  };

  const strumlinesNamespace = funkin.play.visuals.arrows.strumlines || {};
  if (strumlinesNamespace.StrumlineAnimator) {
    strumlinesNamespace.StrumlineAnimator.assignPlayAnimFunction(
      arrow,
      assetKey,
    );
  }

  arrow.playAnim("static", true);
  return arrow;
};