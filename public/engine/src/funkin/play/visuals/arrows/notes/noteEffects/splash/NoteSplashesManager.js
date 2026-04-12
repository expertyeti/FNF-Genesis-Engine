class NoteSplashesManager {
	constructor(scene) {
		this.scene = scene;
		this.keyCount = funkin.NoteDirection ? funkin.NoteDirection.keyCount : 4;
		this.directions = funkin.NoteDirection ? funkin.NoteDirection.getMappings().names : ["left", "down", "up", "right"];
		
		const namespace = funkin.play.visuals.arrows.notes;
		this.skin = new namespace.NoteSplashSkin(this);
		this.logic = new namespace.NoteSplashLogic(this);

		this.skin.reloadSkin();
		this.logic.setupEvents();
		
		this.scene.events.on("ui_skin_changed", () => this.skin.reloadSkin(), this);
	}

	destroy() {
		this.scene.events.off("ui_skin_changed", this.skin.reloadSkin, this);
	}
}
funkin.play.visuals.arrows.notes.NoteSplashesManager = NoteSplashesManager;