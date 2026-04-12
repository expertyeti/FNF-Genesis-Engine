window.funkin = window.funkin || {};
window.funkin.play = window.funkin.play || {};
window.funkin.play.visuals = window.funkin.play.visuals || {};
window.funkin.play.visuals.arrows = window.funkin.play.visuals.arrows || {};
window.funkin.play.visuals.arrows.spawner = window.funkin.play.visuals.arrows.spawner || {};

window.funkin.play.visuals.arrows.spawner.calculateOptimalPoolSize = function(
  chartData, screenHeight, scrollSpeed, scrollConstant = 0.45, safetyMargin = 1.15
) {
  if (!chartData || !Array.isArray(chartData) || chartData.length === 0)
    return 0;

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
};