/**
 * @file ArrowsSpawner.js
 * Clase responsable de instanciar y organizar visualmente los strums, fondos y notas en pantalla.
 * (Ahora implementado como un Facade que delega en el namespace spawner)
 */

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.arrows = funkin.play.visuals.arrows || {};

class ArrowsSpawner {
  static get spawnerAPI() {
    return funkin.play.visuals.arrows.spawner || {};
  }

  static clearExisting(scene) {
    return this.spawnerAPI.clearExisting(scene);
  }

  static spawnStrumlines(scene, strumlines) {
    return this.spawnerAPI.spawnStrumlines(scene, strumlines);
  }

  static createArrow(scene, strumlines, x, y, assetKey, scale, alpha, dir, skinData, isPlayer) {
    return this.spawnerAPI.createArrow(scene, strumlines, x, y, assetKey, scale, alpha, dir, skinData, isPlayer);
  }

  static createStrumAnimations(scene, assetKey, animsData, directions) {
    return this.spawnerAPI.createStrumAnimations(scene, assetKey, animsData, directions);
  }

  static calculateOptimalPoolSize(chartData, screenHeight, scrollSpeed, scrollConstant = 0.45, safetyMargin = 1.15) {
    return this.spawnerAPI.calculateOptimalPoolSize(chartData, screenHeight, scrollSpeed, scrollConstant, safetyMargin);
  }

  static spawnChartNotes(scene, notesManager) {
    return this.spawnerAPI.spawnChartNotes(scene, notesManager);
  }

  static spawnNotesArray(scene, notesManager, chartNotesArray, assetKey, skinData, fallbackFrames) {
    return this.spawnerAPI.spawnNotesArray(scene, notesManager, chartNotesArray, assetKey, skinData, fallbackFrames);
  }

  static createNoteFallbackFrames(scene, assetKey, prefixes) {
    return this.spawnerAPI.createNoteFallbackFrames(scene, assetKey, prefixes);
  }

  static checkSparrowXML(scene, assetKey) {
    return this.spawnerAPI.checkSparrowXML(scene, assetKey);
  }
}

funkin.play.visuals.arrows.ArrowsSpawner = ArrowsSpawner;