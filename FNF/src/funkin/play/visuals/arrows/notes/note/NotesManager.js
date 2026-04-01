/**
 * Orquestador principal de las notas regulares.
 * Delega responsabilidades a modulos especializados para logica, renderizado y api.
 */
class NotesManager {
	constructor(scene, strumlines) {
		this.scene = scene;
		this.strumlines = strumlines;
		this.notes = [];
		this.scrollSpeed = 1.0; // Multiplicador de velocidad de caida
		this.lastSongPos = 0; // Registro del ultimo tiempo de la cancion
		this.globalYOffset = 0;
		this.keyCount = funkin.NoteDirection ? funkin.NoteDirection.keyCount : 4;
		this.prevKeys = new Array(this.keyCount).fill(false); // Estado anterior de teclas

		this.api = new funkin.NoteAPI(this);
		this.skin = new funkin.NoteSkin(this);
		this.logic = new funkin.NoteLogic(this);

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

if (typeof window !== "undefined") funkin.NotesManager = NotesManager;