/**
 * Modulo dedicado a inyectar y gestionar la reproduccion de animaciones y offsets de los strums.
 */
class StrumlineAnimator {
	/**
	 * Asigna la funcion de reproduccion a una flecha individual aplicando sus respectivos desfases.
	 * @param {Phaser.GameObjects.Sprite} arrow 
	 * @param {string} assetKey 
	 */
	static assignPlayAnimFunction(arrow, assetKey) {
		arrow.playAnim = (animType, force = false) => {
			const animName = `${assetKey}_strum_${animType}_${arrow.direction}`;
			
			if (!force && arrow.currentAction === animType) return;
			
			if (arrow.scene.anims.exists(animName)) arrow.play(animName, true);
			
			const offset = arrow.animsOffsets[animType] || [0, 0];
			arrow.x = arrow.baseX + offset[0];
			arrow.y = arrow.baseY + offset[1];

			if (!force && arrow.currentAction !== animType && window.strumelines) {
				window.strumelines.emit('action', { 
					isPlayer: arrow.isPlayer, 
					direction: arrow.direction, 
					action: animType, 
					sprite: arrow 
				});
			}

			arrow.currentAction = animType;
		};
	}
}

if (typeof window !== 'undefined') {
	window.funkin = window.funkin || {};
	funkin.StrumlineAnimator = StrumlineAnimator;
}