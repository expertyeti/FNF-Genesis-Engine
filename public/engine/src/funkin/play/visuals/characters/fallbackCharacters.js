/**
 * @file fallbackCharacters.js
 * Gestiona la lógica visual y el texto de error de los personajes que no pudieron
 * ser cargados o cuyos datos no se encontraron, transformándolos en "fantasmas".
 */
class FallbackCharacters {
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

		if (funkin.play.data.camera && funkin.play.data.camera.addObjToGame) {
			funkin.play.data.camera.addObjToGame(errorText);
		}
	}
}

funkin.play.visuals.characters.FallbackCharacters = FallbackCharacters;