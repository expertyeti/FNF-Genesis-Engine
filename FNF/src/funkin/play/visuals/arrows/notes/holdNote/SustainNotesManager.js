/**
 * Orquestador principal de notas largas. Delega eventos a dependencias logicas y de renderizado.
 */
class SustainNotesManager {
	constructor(scene, strumlines) {
		this.scene = scene;
		this.strumlines = strumlines;
		this.sustains = [];
		this.scrollSpeed = 1.0;
		this.keyCount = funkin.NoteDirection ? funkin.NoteDirection.keyCount : 4;

		this.globalSustainAlpha = 1;
		this.sustainOverlap = 2; // Solapamiento anti grietas
		this.sustainChunkMs = 100;

		this.globalYOffset = 200;
		this.maskWidth = 600;
		this.maskXOffset = 300;

		this.toleranceMs = 150;
		this.missedAlphaMultiplier = 0.4;

		if (this.scene && this.scene.sys && this.scene.sys.game) {
			this.scene.sys.game.events.off("blur");
			this.scene.sys.game.events.off("hidden");
			if (this.scene.sys.game.sound) this.scene.sys.game.sound.pauseOnBlur = false;
		}

		this.maskGraphicsList = [];
		this.sustainMasksList = [];

		for (let i = 0; i < this.keyCount * 2; i++) {
			let mg = this.scene.add.graphics();
			mg.setScrollFactor(0);
			mg.setVisible(false);

			if (funkin.playCamera && funkin.playCamera.addObjToUI) {
				funkin.playCamera.addObjToUI(mg);
			}

			this.maskGraphicsList.push(mg);
			this.sustainMasksList.push(mg.createGeometryMask());
		}

		this.api = new funkin.SustainAPI(this);
		this.skin = new funkin.SustainSkin(this);
		this.logic = new funkin.SustainLogic(this);
		this.renderer = new funkin.SustainRenderer(this);

		this.api.init();
		this.scene.events.on("ui_skin_changed", () => this.skin.reloadSkin(), this);
		this.skin.initSustains();
	}

	update(time, delta) {
		if (!funkin.conductor || this.sustains.length === 0) return;

		this.scrollSpeed =
			funkin.play.chart && funkin.play.chart.get("metadata.speed")
				? funkin.play.chart.get("metadata.speed")
				: 1.0;

		this.logic.update(time, delta);
		this.renderer.update(time, delta);
	}

	destroy() {
		this.scene.events.off("ui_skin_changed", this.skin.reloadSkin, this);
		this.sustains.forEach((s) => {
			if (s.bodyParts) {
				s.bodyParts.forEach((p) => {
					if (p) p.destroy();
				});
			}
			if (s.end) s.end.destroy();
		});
		this.sustains = [];

		if (this.maskGraphicsList) {
			this.maskGraphicsList.forEach((mg) => mg.destroy());
			this.maskGraphicsList = [];
		}
		this.sustainMasksList = [];

		this.api.destroy();
	}
}

if (typeof window !== "undefined") funkin.SustainNotesManager = SustainNotesManager;