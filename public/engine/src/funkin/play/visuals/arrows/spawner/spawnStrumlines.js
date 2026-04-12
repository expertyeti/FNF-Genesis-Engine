window.funkin = window.funkin || {};
window.funkin.play = window.funkin.play || {};
window.funkin.play.visuals = window.funkin.play.visuals || {};
window.funkin.play.visuals.arrows = window.funkin.play.visuals.arrows || {};
window.funkin.play.visuals.arrows.spawner = window.funkin.play.visuals.arrows.spawner || {};

window.funkin.play.visuals.arrows.spawner.spawnStrumlines = function(scene, strumlines) {
  if (!funkin.play || !funkin.play.uiSkins || !funkin.play.session) return;

  const skinData = funkin.play.uiSkins.get("gameplay.strumline");
  if (!skinData) return;

  const assetKey = funkin.play.uiSkins.getAssetKey(skinData.assetPath);
  if (!scene.textures.exists(assetKey)) return;

  const spawner = funkin.play.visuals.arrows.spawner;

  spawner.checkSparrowXML(scene, assetKey);
  spawner.createStrumAnimations(
    scene,
    assetKey,
    skinData.animations,
    strumlines.directions,
  );

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

    const oppArrow = spawner.createArrow(
      scene, strumlines, 0, 0, assetKey, scale, alpha, dir, skinData, false
    );
    strumlines.opponentStrums.push(oppArrow);

    const playerArrow = spawner.createArrow(
      scene, strumlines, 0, 0, assetKey, scale, alpha, dir, skinData, true
    );
    strumlines.playerStrums.push(playerArrow);
  }

  const strumlinesNamespace = funkin.play.visuals.arrows.strumlines || {};
  if (strumlinesNamespace.StrumlineLayout) {
    strumlinesNamespace.StrumlineLayout.updateLayout(strumlines);
  }
};