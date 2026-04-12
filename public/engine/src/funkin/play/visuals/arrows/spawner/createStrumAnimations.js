window.funkin = window.funkin || {};
window.funkin.play = window.funkin.play || {};
window.funkin.play.visuals = window.funkin.play.visuals || {};
window.funkin.play.visuals.arrows = window.funkin.play.visuals.arrows || {};
window.funkin.play.visuals.arrows.spawner = window.funkin.play.visuals.arrows.spawner || {};

  /**
   * ALGORITMO DE OPTIMIZACION SUPER SECRETO!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
   * Calcula el tamaño óptimo del Object Pool basado en la densidad máxima de notas
   * usando el algoritmo de Sliding Window (O(n)).
   *
   * Fórmula: V = H / (S × C)
   *   - H: altura de pantalla
   *   - S: velocidad de scroll
   *   - C: constante del motor (0.45)
   *
   * @param {Array} chartData - Array de notas ordenadas por tiempo
   * @param {number} screenHeight - Altura de la pantalla en píxeles
   * @param {number} scrollSpeed - Velocidad de desplazamiento
   * @param {number} scrollConstant - Constante del motor (por defecto 0.45)
   * @param {number} safetyMargin - Margen de seguridad (por defecto 1.15)
   * @returns {number} Tamaño óptimo del pool redondeado hacia arriba
   */

window.funkin.play.visuals.arrows.spawner.createStrumAnimations = function(scene, assetKey, animsData, directions) {
  const frameNames = scene.textures.get(assetKey).getFrameNames();

  directions.forEach((dir) => {
    const dirAnims = animsData[dir];
    if (!dirAnims) return;

    Object.keys(dirAnims).forEach((animType) => {
      const prefixToSearch = dirAnims[animType];
      const animName = `${assetKey}_strum_${animType}_${dir}`;

      if (scene.anims.exists(animName)) return;

      const matchingFrames = frameNames.filter((name) =>
        name.startsWith(prefixToSearch),
      );
      matchingFrames.sort();

      if (matchingFrames.length > 0) {
        scene.anims.create({
          key: animName,
          frames: matchingFrames.map((frame) => ({
            key: assetKey,
            frame: frame,
          })),
          frameRate: 24,
          repeat: 0,
        });
      }
    });
  });
};