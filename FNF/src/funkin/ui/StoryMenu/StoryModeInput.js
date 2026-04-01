/**
 * Manejador de la entrada de controles para el menú de historia
 */
class StoryModeInput {
	/**
	 * @param {Phaser.Scene} scene
	 */
	constructor(scene) {
		this.scene = scene;
		this.wheelTimer = 0; // Evita multiples llamadas simultaneas al usar la rueda
		this.touchStartY = 0;
		this.touchStartX = 0;
		this.isSwiping = false; // Indica si se realiza un gesto táctil
		this.activeArrow = null;

		this.onWheel = (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
			if (!this.scene.canInteract) return;
			if (this.scene.time.now < this.wheelTimer) return;
			this.wheelTimer = this.scene.time.now + 100;

			if (deltaY > 0) window.storyModeEventBus.emit("change_week", 1);
			else if (deltaY < 0) window.storyModeEventBus.emit("change_week", -1);
		};
		this.scene.input.on("wheel", this.onWheel);

		if (!this.scene.sys.game.device.os.desktop) this.setupMobileControls();
	}

	/**
	 * Configura los controles táctiles para dispositivos móviles
	 */
	setupMobileControls() {
		if (this.scene.titlesManager && this.scene.titlesManager.titleSprites) {
			this.scene.titlesManager.titleSprites.forEach((sprite) =>
				sprite.setInteractive(),
			);
		}

		this.onPointerDown = (pointer, gameObjects) => {
			this.touchStartY = pointer.y;
			this.touchStartX = pointer.x;
			this.isSwiping = false;

			if (gameObjects.length > 0) {
				const obj = gameObjects[0];
				if (obj.name === "leftArrowDiff") {
					if (funkin.controls) funkin.controls.simulatePress("UI_LEFT");
					this.activeArrow = "UI_LEFT";
				} else if (obj.name === "rightArrowDiff") {
					if (funkin.controls) funkin.controls.simulatePress("UI_RIGHT");
					this.activeArrow = "UI_RIGHT";
				}
			}
		};

		this.onPointerMove = (pointer) => {
			if (!pointer.isDown || !this.scene.canInteract) return;

			const diffY = pointer.y - this.touchStartY;
			const diffX = pointer.x - this.touchStartX;

			if (Math.abs(diffY) > 70) {
				this.isSwiping = true;
				window.storyModeEventBus.emit("change_week", diffY < 0 ? 1 : -1);
				this.touchStartY = pointer.y;
			}

			if (Math.abs(diffX) > 70 && !this.activeArrow) {
				this.isSwiping = true;
				if (this.scene.difficultyManager)
					this.scene.difficultyManager.changeDifficulty(diffX < 0 ? 1 : -1);
				this.touchStartX = pointer.x;
			}
		};

		this.onPointerUp = (pointer, gameObjects) => {
			if (this.activeArrow) {
				if (funkin.controls) funkin.controls.simulateRelease(this.activeArrow);
				this.activeArrow = null;
			}

			if (!this.isSwiping && this.scene.canInteract) {
				if (gameObjects.length > 0) {
					const obj = gameObjects[0];
					if (
						this.scene.titlesManager &&
						this.scene.titlesManager.titleSprites.includes(obj)
					) {
						const index = this.scene.titlesManager.titleSprites.indexOf(obj);
						if (index === this.scene.dataManager.selectedWeekIndex) {
							this.confirmSelection();
						} else {
							this.scene.dataManager.selectedWeekIndex = index;
							this.scene.changeWeek(0);
						}
					}
				}
			}
			this.isSwiping = false;
		};

		this.scene.input.on("pointerdown", this.onPointerDown);
		this.scene.input.on("pointermove", this.onPointerMove);
		this.scene.input.on("pointerup", this.onPointerUp);
	}

	/**
	 * Actualiza el estado lógico de los inputs en el ciclo del juego
	 */
	update() {
		if (!this.scene.canInteract || !funkin.controls) return;

		if (funkin.controls.BACK_P) window.storyModeEventBus.emit("go_back");
		if (funkin.controls.ACCEPT_P) this.confirmSelection();
		if (funkin.controls.UI_UP_P)
			window.storyModeEventBus.emit("change_week", -1);
		if (funkin.controls.UI_DOWN_P)
			window.storyModeEventBus.emit("change_week", 1);

		if (this.scene.difficultyManager) {
			if (funkin.controls.UI_LEFT_P)
				this.scene.difficultyManager.changeDifficulty(-1);
			if (funkin.controls.UI_RIGHT_P)
				this.scene.difficultyManager.changeDifficulty(1);
		}
	}

	/**
	 * Confirma la selección de la semana actual e inicia PlayScene
	 */
	confirmSelection() {
		if (!this.scene.canInteract) return;
		this.scene.canInteract = false;

		if (this.scene.cache.audio.exists("confirmMenu"))
			this.scene.sound.play("confirmMenu");
		if (navigator.vibrate) navigator.vibrate([150, 50, 150]);

		if (this.scene.titlesManager)
			this.scene.titlesManager.startFlashing(
				this.scene.dataManager.selectedWeekIndex,
			);
		if (this.scene.characterPropsManager)
			this.scene.characterPropsManager.playConfirm();

		const currentWeek = this.scene.dataManager.getCurrentWeek();
		let playlist = [];

		const songsArray =
			currentWeek && currentWeek.data
				? currentWeek.data.tracks || currentWeek.data.songs
				: null;

		if (songsArray && Array.isArray(songsArray)) {
			playlist = songsArray.map((songData) => {
				if (Array.isArray(songData)) return songData[0];
				if (typeof songData === "string") return songData;
				if (songData && songData.name) return songData.name;
				return "Test";
			});
		}

		if (playlist.length === 0) playlist = ["Test"];

		const diffNames = ["easy", "normal", "hard"];
		const diffString =
			diffNames[this.scene.dataManager.selectedDifficulty] || "normal";

		const playData = {
			sourceScene: "StoryModeScene",
			songPlayList: playlist,
			actuallyPlaying: playlist[0],
			difficulty: diffString,
		};

		funkin.PlayDataPayload = JSON.parse(JSON.stringify(playData));

		this.scene.time.delayedCall(1500, () => {
			const music = this.scene.sound.get("freakyMenu");
			if (music && music.isPlaying) music.stop();

			if (typeof funkin !== "undefined" && funkin.transition) {
				funkin.transition(this.scene, "PlayScene");
			} else {
				this.scene.scene.start("PlayScene", playData);
			}
		});
	}

	/**
	 * Desmonta y limpia los eventos
	 */
	destroy() {
		this.scene.input.off("wheel", this.onWheel);

		if (!this.scene.sys.game.device.os.desktop) {
			this.scene.input.off("pointerdown", this.onPointerDown);
			this.scene.input.off("pointermove", this.onPointerMove);
			this.scene.input.off("pointerup", this.onPointerUp);
		}
	}
}

window.StoryModeInput = StoryModeInput;