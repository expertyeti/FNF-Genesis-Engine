/**
 * @file NotesManager.js
 * Orquestador principal de las notas regulares.
 * Delega responsabilidades a módulos especializados para lógica, renderizado y api.
 */
class NotesManager {
	constructor(scene, strumlines) {
		this.scene = scene;
		this.strumlines = strumlines;
		this.notes = [];
		this.scrollSpeed = 1.0; 
		this.lastSongPos = 0; 
		this.globalYOffset = 0;

		const notesNamespace = funkin.play.visuals.arrows.notes;

		this.keyCount = notesNamespace.NoteDirection ? notesNamespace.NoteDirection.keyCount : 4;
		
		// Inicialización explícita y separada de las teclas de los jugadores 
		// para evitar choques en processInputs.js
		this.prevKeysP1 = new Array(this.keyCount).fill(false);
		this.prevKeysP2 = new Array(this.keyCount).fill(false);

		this.api = new notesNamespace.NoteAPI(this);
		this.skin = new notesNamespace.NoteSkin(this);
		this.logic = new notesNamespace.NoteLogic(this);

		this.api.init();
		this.scene.events.on("ui_skin_changed", () => this.skin.reloadSkin(), this);
	}

	update(time, delta) {
		this.logic.update(time, delta);
	}

	destroy() {
		this.scene.events.off("ui_skin_changed", this.skin.reloadSkin, this);
		this.notes.forEach((note) => {
			if (note && note.active) {
				note.stop();
				note.destroy();
			}
		});
		this.notes = [];
		this.api.destroy();
	}
}

funkin.play.visuals.arrows.notes.NotesManager = NotesManager;