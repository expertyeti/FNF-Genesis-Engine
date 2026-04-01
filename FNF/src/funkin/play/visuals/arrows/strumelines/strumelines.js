/**
 * Clase principal que administra las flechas receptoras (strums).
 * Delega logica a modulos especificos de animacion, skins, updates y layout.
 */
class Strumlines {
	/**
	 * @param {Phaser.Scene} scene 
	 */
	constructor(scene) {
		this.scene = scene;
		this.opponentStrums = [];
		this.playerStrums = [];
		
		this.opponentBg = null; // Bloque oscuro de fondo para las flechas del enemigo
		this.playerBg = null; // Bloque oscuro de fondo para las flechas del jugador

		this.keyCount = (funkin.NoteDirection && typeof funkin.NoteDirection.keyCount !== 'undefined') 
			? funkin.NoteDirection.keyCount 
			: 4;
			
		this.directions = (funkin.NoteDirection && typeof funkin.NoteDirection.getMappings === 'function') 
			? funkin.NoteDirection.getMappings().names 
			: ['left', 'down', 'up', 'right'];

		if (funkin.StrumlinesAPI) funkin.StrumlinesAPI.init(this);

		this.scene.events.on('ui_skin_changed', this.reloadStrumlineSkin, this);
	}

	/**
	 * Devuelve el indice numerico de una direccion.
	 * @param {string|number} dir 
	 * @returns {number}
	 */
	getDirIndex(dir) {
		if (typeof dir === 'number') return dir;
		const index = this.directions.indexOf(dir.toLowerCase());
		return index !== -1 ? index : 0;
	}

	/**
	 * Delega la recarga de texturas y escalas al gestor de skins.
	 */
	reloadStrumlineSkin() {
		if (funkin.StrumlineSkin) {
			funkin.StrumlineSkin.reload(this);
		}
	}

	/**
	 * @param {number} time 
	 * @param {number} delta 
	 */
	update(time, delta) {
		if (funkin.StrumlineUpdater) {
			funkin.StrumlineUpdater.update(this, time);
		}
	}

	/**
	 * Limpia referencias y vacia los arreglos de memoria.
	 */
	destroy() {
		this.scene.events.off('ui_skin_changed', this.reloadStrumlineSkin, this);
		
		this.opponentStrums.forEach(arrow => { 
			if (arrow && arrow.active) { 
				arrow.stop(); 
				arrow.destroy(); 
			} 
		});
		
		this.playerStrums.forEach(arrow => { 
			if (arrow && arrow.active) { 
				arrow.stop(); 
				arrow.destroy(); 
			} 
		});
		
		this.opponentStrums = [];
		this.playerStrums = [];

		if (this.opponentBg) this.opponentBg.destroy();
		if (this.playerBg) this.playerBg.destroy();
		
		if (window.strumelines) { 
			window.strumelines._listeners = {}; 
			window.strumelines._globalListeners = []; 
		}
	}
}

if (typeof window !== 'undefined') {
	window.funkin = window.funkin || {};
	funkin.Strumlines = Strumlines;
}