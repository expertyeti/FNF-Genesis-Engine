/**
 * Gestiona la lógica visual y el texto de error de los personajes que no pudieron
 * ser cargados o cuyos datos no se encontraron, transformándolos en "fantasmas".
 */
class FallbackCharacters {
	/**
	 * Aplica las propiedades de fallback a un sprite y le añade texto de advertencia.
	 * @param {Phaser.Scene} scene 
	 * @param {Phaser.GameObjects.Sprite} sprite 
	 * @param {string} errorMsg 
	 * @param {number} targetX 
	 * @param {number} scrollX 
	 * @param {number} scrollY 
	 * @param {number} layer 
	 */
	static apply(scene, sprite, errorMsg, targetX, scrollX, scrollY, layer) {
		sprite.setBlendMode(Phaser.BlendModes.ERASE);
		sprite.setAlpha(1);

		const errorText = scene.add.text(targetX, sprite.y - 20, errorMsg, { 
			fontFamily: 'vcr', 
			fontSize: '28px', 
			color: '#ffffff', 
			stroke: '#000000',
			strokeThickness: 4
		});
		
		errorText.setOrigin(0.5, 1); 
		errorText.setScrollFactor(scrollX, scrollY);
		errorText.setDepth((layer !== undefined ? layer : 0) + 1); 

		if (funkin.playCamera && funkin.playCamera.addObjToGame) {
			funkin.playCamera.addObjToGame(errorText);
		}
	}
}

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.FallbackCharacters = FallbackCharacters;