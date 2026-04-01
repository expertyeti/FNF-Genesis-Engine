/**
 * Genera el fondo de vida (Enemigo) y la barra de llenado (Jugador) en formato RIGHT_TO_LEFT.
 * Obtiene los colores RGB en tiempo real desde el nodo 'health' de los personajes.
 */
class BarColors {
	/**
	 * @param {Phaser.Scene} scene 
	 * @param {number} x 
	 * @param {number} y 
	 * @param {number} width 
	 * @param {number} height 
	 */
	constructor(scene, x, y, width, height) {
		this.scene = scene;
		this.width = width;
		
		const defaultEnemy = (funkin.PBOT && funkin.PBOT.Constants) ? (funkin.PBOT.Constants.COLOR_HEALTH_BAR_RED & 0xffffff) : 0xff0000;
		const defaultPlayer = (funkin.PBOT && funkin.PBOT.Constants) ? (funkin.PBOT.Constants.COLOR_HEALTH_BAR_GREEN & 0xffffff) : 0x00ff00;
		
		this.bgRect = scene.add.rectangle(x, y, width, height, defaultEnemy).setOrigin(0, 0); // Fondo de la barra indicando ventaja rival
		this.fillRect = scene.add.rectangle(x + width, y, width, height, defaultPlayer).setOrigin(1, 0); // Barra superpuesta indicando vida del jugador
	}

	/**
	 * @param {number} healthLerp 
	 */
	update(healthLerp) {
		this.updateColors();

		const maxHealth = (funkin.PBOT && funkin.PBOT.Constants) ? funkin.PBOT.Constants.HEALTH_MAX : 2.0;
		const percent = Math.max(0, Math.min(1, healthLerp / maxHealth)); // Porcentaje normalizado de la barra
		
		this.fillRect.scaleX = percent;
	}

	updateColors() {
		if (!this.scene || !this.scene.stageCharacters) return;

		const enemyChar = this.scene.stageCharacters.enemy; 
		const playerChar = this.scene.stageCharacters.player; 

		const enemyData = enemyChar ? enemyChar.charData : null; 
		const playerData = playerChar ? playerChar.charData : null; 

		let enemyColorHex = (funkin.PBOT && funkin.PBOT.Constants) ? (funkin.PBOT.Constants.COLOR_HEALTH_BAR_RED & 0xffffff) : 0xff0000;
		let playerColorHex = (funkin.PBOT && funkin.PBOT.Constants) ? (funkin.PBOT.Constants.COLOR_HEALTH_BAR_GREEN & 0xffffff) : 0x00ff00;

        // Lee y extrae directamente de health.color (Formato [R, G, B])
		if (enemyData && enemyData.health && Array.isArray(enemyData.health.color) && enemyData.health.color.length >= 3) {
			const rgb = enemyData.health.color;
			enemyColorHex = Phaser.Display.Color.GetColor(rgb[0], rgb[1], rgb[2]);
		}
		
		if (playerData && playerData.health && Array.isArray(playerData.health.color) && playerData.health.color.length >= 3) {
			const rgb = playerData.health.color;
			playerColorHex = Phaser.Display.Color.GetColor(rgb[0], rgb[1], rgb[2]);
		}

		if (this.bgRect.fillColor !== enemyColorHex) {
			this.bgRect.setFillStyle(enemyColorHex);
		}
		
		if (this.fillRect.fillColor !== playerColorHex) {
			this.fillRect.setFillStyle(playerColorHex);
		}
	}
}

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.BarColors = BarColors;