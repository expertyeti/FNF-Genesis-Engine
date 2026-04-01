/**
 * Orquestador principal de las particulas o impactos visuales al acertar.
 */
class NoteSplashesManager {
	constructor(scene) {
		this.scene = scene;
		this.keyCount = funkin.NoteDirection ? funkin.NoteDirection.keyCount : 4;
		this.directions = funkin.NoteDirection ? funkin.NoteDirection.getMappings().names : ["left", "down", "up", "right"];
		
		this.skin = new funkin.NoteSplashSkin(this);
		this.logic = new funkin.NoteSplashLogic(this);

		this.skin.reloadSkin();
		this.logic.setupEvents();
		
		this.scene.events.on("ui_skin_changed", () => this.skin.reloadSkin(), this);
	}

	destroy() {
		this.scene.events.off("ui_skin_changed", this.skin.reloadSkin, this);
	}
}

if (typeof window !== "undefined") funkin.NoteSplashesManager = NoteSplashesManager;