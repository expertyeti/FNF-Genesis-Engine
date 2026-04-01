/**
 * Gestiona de manera exclusiva el posicionamiento base, anclaje, escala y profundidad de los personajes.
 * Establece el origen rigido en (0, 0) para delegar los offsets a AnimateCharacters.
 */
class PositionCharacters {
	/**
	 * @param {Phaser.GameObjects.Sprite} sprite
	 * @param {Object} charData
	 * @param {Object} slotData
	 */
	static apply(sprite, charData, slotData = null) {
		if (!sprite || !sprite.active) return;

		sprite.setOrigin(0, 0);

		let stageX = 0; // Coordenada referencial X del escenario
		let stageY = 0; // Coordenada referencial Y del escenario

		if (slotData && slotData.position) {
			stageX = slotData.position[0] || 0;
			stageY = slotData.position[1] || 0;
		}

		let charOffsetX = 0; // Desplazamiento X exclusivo del personaje
		let charOffsetY = 0; // Desplazamiento Y exclusivo del personaje

		if (charData && charData.position) {
			charOffsetX = charData.position[0] || 0;
			charOffsetY = charData.position[1] || 0;
		}

		let scale = 1;
		if (charData && charData.scale !== undefined) scale = charData.scale;
		if (slotData && slotData.scale !== undefined) scale *= slotData.scale;

		sprite.setScale(scale);

		if (charData && charData.antialiasing === false) {
			if (sprite.texture) sprite.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
		}

		if (slotData && slotData.layer !== undefined) {
			sprite.setDepth(slotData.layer);
		}

		if (slotData && slotData.scrollFactor !== undefined) {
			if (Array.isArray(slotData.scrollFactor)) {
				sprite.setScrollFactor(slotData.scrollFactor[0], slotData.scrollFactor[1]);
			} else {
				sprite.setScrollFactor(slotData.scrollFactor);
			}
		}

		const finalX = stageX + charOffsetX;
		const finalY = stageY + charOffsetY;

		// Posiciona el sprite en el punto cero antes de cualquier offset de animacion
		sprite.setPosition(finalX, finalY);

		sprite.baseX = sprite.x;
		sprite.baseY = sprite.y;
	}
}

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.PositionCharacters = PositionCharacters;