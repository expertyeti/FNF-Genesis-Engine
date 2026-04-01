/**
 * Orquestador del efecto de retencion en puntas de notas.
 */
class HoldCoversManager {
	constructor(scene) {
		this.scene = scene;

		this.keyCount = funkin.NoteDirection ? funkin.NoteDirection.keyCount : 4;
		this.directions = funkin.NoteDirection ? funkin.NoteDirection.getMappings().names : ["left", "down", "up", "right"];

		this.activeCovers = {
			player: new Array(this.keyCount).fill(null),
			opponent: new Array(this.keyCount).fill(null),
		};

		this.skin = new funkin.HoldCoverSkin(this);
		this.logic = new funkin.HoldCoverLogic(this);

		this.skin.reloadSkin();
		this.logic.setupEvents();
		
		this.scene.events.on("ui_skin_changed", () => this.skin.reloadSkin(true), this);
		this.scene.events.on("update", () => this.logic.update(), this);
	}

	destroy() {
		this.scene.events.off("ui_skin_changed", this.skin.reloadSkin, this);
		this.scene.events.off("update", this.logic.update, this);
		this.activeCovers.player.forEach((c) => {
			if (c) {
				if (c.anims) c.stop();
				c.destroy();
			}
		});
		this.activeCovers.opponent.forEach((c) => {
			if (c) {
				if (c.anims) c.stop();
				c.destroy();
			}
		});
		this.activeCovers = {
			player: new Array(this.keyCount).fill(null),
			opponent: new Array(this.keyCount).fill(null),
		};
	}
}

if (typeof window !== "undefined") funkin.HoldCoversManager = HoldCoversManager;