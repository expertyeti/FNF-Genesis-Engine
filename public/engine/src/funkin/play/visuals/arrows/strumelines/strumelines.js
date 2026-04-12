/**
 * @file strumelines.js
 * Clase principal que administra las flechas receptoras (strums).
 * Delega lógica a módulos específicos de animación, skins, updates y layout.
 */
class Strumlines {
	constructor(scene) {
		this.scene = scene;
		this.opponentStrums = [];
		this.playerStrums = [];
		
		this.opponentBg = null; 
		this.playerBg = null; 

		const NoteDirection = funkin.play.visuals.arrows.notes.NoteDirection;

		this.keyCount = (NoteDirection && typeof NoteDirection.keyCount !== 'undefined') 
			? NoteDirection.keyCount 
			: 4;
			
		this.directions = (NoteDirection && typeof NoteDirection.getMappings === 'function') 
			? NoteDirection.getMappings().names 
			: ['left', 'down', 'up', 'right'];

		const strumlinesNamespace = funkin.play.visuals.arrows.strumlines;

		if (strumlinesNamespace.StrumlinesAPI) {
			strumlinesNamespace.StrumlinesAPI.init(this);
		}

		this.scene.events.on('ui_skin_changed', this.reloadStrumlineSkin, this);

		// FIX DE INICIALIZACIÓN: Forzamos que se calcule el layout exacto desde el frame 0.
		this.scene.events.once('update', () => {
			if (funkin.play.visuals.arrows.strumlines.StrumlineLayout) {
				funkin.play.visuals.arrows.strumlines.StrumlineLayout.updateLayout(this);
			}
		});
	}

	getDirIndex(dir) {
		if (typeof dir === 'number') return dir;
		const index = this.directions.indexOf(dir.toLowerCase());
		return index !== -1 ? index : 0;
	}

	reloadStrumlineSkin() {
		const strumlinesNamespace = funkin.play.visuals.arrows.strumlines;
		if (strumlinesNamespace.StrumlineSkin) {
			strumlinesNamespace.StrumlineSkin.reload(this);
		}
	}

	update(time, delta) {
		const strumlinesNamespace = funkin.play.visuals.arrows.strumlines;
		if (strumlinesNamespace.StrumlineUpdater) {
			strumlinesNamespace.StrumlineUpdater.update(this, time);
		}
	}

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
	}
}

funkin.play.visuals.arrows.strumlines.Strumlines = Strumlines;