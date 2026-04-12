window.funkin = window.funkin || {};
window.funkin.play = window.funkin.play || {};
window.funkin.play.visuals = window.funkin.play.visuals || {};
window.funkin.play.visuals.arrows = window.funkin.play.visuals.arrows || {};
window.funkin.play.visuals.arrows.spawner = window.funkin.play.visuals.arrows.spawner || {};

window.funkin.play.visuals.arrows.spawner.clearExisting = function(scene) {
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
};