window.funkin = window.funkin || {};
window.funkin.play = window.funkin.play || {};
window.funkin.play.visuals = window.funkin.play.visuals || {};
window.funkin.play.visuals.arrows = window.funkin.play.visuals.arrows || {};
window.funkin.play.visuals.arrows.spawner = window.funkin.play.visuals.arrows.spawner || {};

window.funkin.play.visuals.arrows.spawner.spawnChartNotes = function(scene, notesManager) {
  if (
    !funkin.play ||
    !funkin.play.uiSkins ||
    !funkin.play.session ||
    !funkin.play.chart
  )
    return;

  const skinData = funkin.play.uiSkins.get("gameplay.notes");
  const chartData = funkin.play.chart.get("notes");

  if (
    !skinData ||
    !chartData ||
    !Array.isArray(chartData) ||
    chartData.length === 0
  )
    return;

  const assetKey = funkin.play.uiSkins.getAssetKey(skinData.assetPath);
  if (!scene.textures.exists(assetKey)) return;

  const spawner = funkin.play.visuals.arrows.spawner;

  spawner.checkSparrowXML(scene, assetKey);

  const screenHeight = scene.scale.height || 720;
  const scrollSpeed = notesManager.scrollSpeed || 1.0;
  const optimalPoolSize = spawner.calculateOptimalPoolSize(
    chartData,
    screenHeight,
    scrollSpeed,
  );

  console.log(
    `[ArrowsSpawner] Pool Size Calculado:`,
    `Max Simultaneous: ${Math.ceil(optimalPoolSize / 1.15)}, ` +
      `Total con Margen: ${optimalPoolSize}, ` +
      `Total Notas: ${chartData.length}`,
  );

  if (notesManager.poolSize === undefined) {
    notesManager.poolSize = optimalPoolSize;
  }

  const fallbackFrames = spawner.createNoteFallbackFrames(
    scene,
    assetKey,
    skinData.animations,
  );
  
  spawner.spawnNotesArray(
    scene,
    notesManager,
    chartData,
    assetKey,
    skinData,
    fallbackFrames,
  );
};