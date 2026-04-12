/**
 * Modulo dedicado a inyectar y gestionar la reproduccion de animaciones y offsets de los strums.
 */
window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.arrows = funkin.play.visuals.arrows || {};
funkin.play.visuals.arrows.strumlines = funkin.play.visuals.arrows.strumlines || {};

class StrumlineAnimator {
  /**
   * Asigna la funcion de reproduccion a una flecha individual aplicando sus respectivos desfases.
   * @param {Phaser.GameObjects.Sprite} arrow 
   * @param {string} assetKey 
   */
  static assignPlayAnimFunction(arrow, assetKey) {
    arrow.playAnim = (animType, force = false) => {
      // PREVENCIÓN DEL ERROR FATAL L:16
      if (!arrow || !arrow.scene || !arrow.scene.anims) return;

      const animName = `${assetKey}_strum_${animType}_${arrow.direction}`;
      
      // EVITA REINICIAR LA ANIMACIÓN CADA FRAME
      if (!force && arrow.currentAction === animType) return;
      
      // REPRODUCE LA ANIMACIÓN DINÁMICA
      if (arrow.scene.anims.exists(animName)) arrow.play(animName, true);
      
      // APLICA LOS OFFSETS (DESFASES) ORIGINALES DE LA FLECHA
      const offset = arrow.animsOffsets && arrow.animsOffsets[animType] ? arrow.animsOffsets[animType] : [0, 0];
      arrow.x = arrow.baseX + offset[0];
      arrow.y = arrow.baseY + offset[1];

      // EMITE EVENTOS SI ES NECESARIO
      if (!force && arrow.currentAction !== animType && window.strumelines) {
        window.strumelines.emit('action', { 
          isPlayer: arrow.isPlayer, 
          direction: arrow.direction, 
          action: animType, 
          sprite: arrow 
        });
      }

      arrow.currentAction = animType;

      // ACTUALIZA EL TIEMPO DE RESETEO PARA EL UPDATER (Vuelve a estado static después de soltar)
      if (animType === 'confirm' || animType === 'press') {
          arrow.resetTime = (arrow.scene.time ? arrow.scene.time.now : performance.now()) + 150;
      }
    };
  }
}

funkin.play.visuals.arrows.strumlines.StrumlineAnimator = StrumlineAnimator;