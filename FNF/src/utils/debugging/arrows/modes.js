/**
 * Herramienta de testeo para alternar las configuraciones de los carriles y la vista de juego.
 * Funciona mediante eventos de teclado directos.
 *
 * Asignacion de Teclas:
 * [Shift + D] = Alterna entre Upscroll y Downscroll
 * [Shift + M] = Alterna Middle Scroll (Apagado -> Normal -> Estrecho -> Ancho -> Split -> Mobile)
 * [Shift + B] = Alterna la visibilidad del fondo oscuro de las strumlines
 * [Shift + G] = Alterna el Ghost Tapping
 * [Shift + E] = Alterna a quien controlas (Jugador u Oponente)
 * [Shift + U] = Alterna el modo de los PopUps de combos y juicios (Apariencia)
 * [Shift + P] = Alterna el movimiento de los PopUps (always -> middlescroll -> never)
 * [Shift + V] = Oculta o Muestra las notas del enemigo
 * [Shift + O] = Cambia la opacidad del fondo de las strumlines
 */
class ArrowModesDebug {
	/**
	 * @param {Phaser.Scene} scene Escena activa de Phaser
	 */
	constructor(scene) {
		this.scene = scene;

		funkin.play = funkin.play || {};
		funkin.play.options = funkin.play.options || {};

		try {
			const storedDown = localStorage.getItem("fnf_downscroll");
			const storedMid = localStorage.getItem("fnf_middlescroll");
			const storedBg = localStorage.getItem("fnf_strumlineBg");
			const storedGhost = localStorage.getItem("fnf_ghostTapping");
			const storedOpponent = localStorage.getItem("fnf_playAsOpponent");
			const storedPopup = localStorage.getItem("fnf_popupMode");
			const storedMovePopup = localStorage.getItem("fnf_movePopUp");
			const storedHideEnemy = localStorage.getItem("fnf_hideOpponentNotes");
			const storedOpacity = localStorage.getItem("fnf_laneOpacity");

			if (storedDown !== null) funkin.play.options.downscroll = storedDown === "true";

			if (storedMid !== null) {
				if (storedMid === "true") funkin.play.options.middlescroll = true;
				else if (storedMid === "false") funkin.play.options.middlescroll = false;
				else funkin.play.options.middlescroll = storedMid;
			}

			if (storedBg !== null) funkin.play.options.strumlineBg = storedBg === "true";
			if (storedGhost !== null) funkin.play.options.ghostTapping = storedGhost === "true";
			if (storedOpponent !== null) funkin.play.options.playAsOpponent = storedOpponent === "true";
			if (storedPopup !== null) funkin.play.options.popupMode = storedPopup;
			if (storedMovePopup !== null) funkin.play.options.movePopUp = storedMovePopup;
			if (storedHideEnemy !== null) funkin.play.options.hideOpponentNotes = storedHideEnemy === "true";
			if (storedOpacity !== null) funkin.play.options.laneOpacity = parseFloat(storedOpacity);
		} catch (error) {}

		if (funkin.play.options.downscroll === undefined) funkin.play.options.downscroll = false;
		if (funkin.play.options.middlescroll === undefined) funkin.play.options.middlescroll = false;
		if (funkin.play.options.strumlineBg === undefined) funkin.play.options.strumlineBg = false;
		if (funkin.play.options.ghostTapping === undefined) funkin.play.options.ghostTapping = true;
		if (funkin.play.options.playAsOpponent === undefined) funkin.play.options.playAsOpponent = false;
		if (funkin.play.options.popupMode === undefined) funkin.play.options.popupMode = "normal";
		if (funkin.play.options.movePopUp === undefined) funkin.play.options.movePopUp = "always";
		if (funkin.play.options.hideOpponentNotes === undefined) funkin.play.options.hideOpponentNotes = false;
		if (funkin.play.options.laneOpacity === undefined) funkin.play.options.laneOpacity = 0.5;

		this.keydownListener = (event) => {
			if (!event.shiftKey) return;

			if (event.code === "KeyD") this.toggleDownscroll();
			if (event.code === "KeyM") this.toggleMiddleScroll();
			if (event.code === "KeyB") this.toggleBackground();
			if (event.code === "KeyG") this.toggleGhostTapping();
			if (event.code === "KeyE") this.togglePlayAsOpponent();
			if (event.code === "KeyU") this.togglePopupMode();
			if (event.code === "KeyP") this.toggleMovePopUp();
			if (event.code === "KeyV") this.toggleOpponentNotes();
			if (event.code === "KeyO") this.toggleLaneOpacity();
		};

		if (this.scene && this.scene.input && this.scene.input.keyboard) {
			this.scene.input.keyboard.on("keydown", this.keydownListener);
		}

		this.checkHitboxVisibility();
	}

	saveOptions() {
		try {
			localStorage.setItem("fnf_downscroll", funkin.play.options.downscroll);
			localStorage.setItem("fnf_middlescroll", funkin.play.options.middlescroll);
			localStorage.setItem("fnf_strumlineBg", funkin.play.options.strumlineBg);
			localStorage.setItem("fnf_ghostTapping", funkin.play.options.ghostTapping);
			localStorage.setItem("fnf_playAsOpponent", funkin.play.options.playAsOpponent);
			localStorage.setItem("fnf_popupMode", funkin.play.options.popupMode);
			localStorage.setItem("fnf_movePopUp", funkin.play.options.movePopUp);
			localStorage.setItem("fnf_hideOpponentNotes", funkin.play.options.hideOpponentNotes);
			localStorage.setItem("fnf_laneOpacity", funkin.play.options.laneOpacity);
		} catch (error) {}
	}

	toggleDownscroll() {
		funkin.play.options.downscroll = !funkin.play.options.downscroll;
		this.saveOptions();
		this.refreshLayout();
	}

	toggleMiddleScroll() {
		const modes = [false, true, "narrow", "wide", "split", "mobile"];
		let currentIndex = modes.indexOf(funkin.play.options.middlescroll);

		if (currentIndex === -1) currentIndex = 0;
		currentIndex = (currentIndex + 1) % modes.length;

		funkin.play.options.middlescroll = modes[currentIndex];
		this.saveOptions();
		this.refreshLayout();
		this.checkHitboxVisibility();
	}

	toggleBackground() {
		funkin.play.options.strumlineBg = !funkin.play.options.strumlineBg;
		this.saveOptions();
		this.refreshLayout();
	}

	toggleGhostTapping() {
		funkin.play.options.ghostTapping = !funkin.play.options.ghostTapping;
		this.saveOptions();
		this.refreshLayout();
	}

	togglePlayAsOpponent() {
		funkin.play.options.playAsOpponent = !funkin.play.options.playAsOpponent;
		this.saveOptions();
		this.refreshLayout();
	}

	togglePopupMode() {
		const modes = ["normal", "stacking", "bubble"];
		let currentIndex = modes.indexOf(funkin.play.options.popupMode);

		if (currentIndex === -1) currentIndex = 0;
		currentIndex = (currentIndex + 1) % modes.length;

		funkin.play.options.popupMode = modes[currentIndex];
		this.saveOptions();
	}

	toggleMovePopUp() {
		const modes = ["always", "middlescroll", "never"];
		let currentIndex = modes.indexOf(funkin.play.options.movePopUp);

		if (currentIndex === -1) currentIndex = 0;
		currentIndex = (currentIndex + 1) % modes.length;

		funkin.play.options.movePopUp = modes[currentIndex];
		this.saveOptions();
		console.log("Move PopUp Mode cambiado a:", funkin.play.options.movePopUp);
	}

	toggleOpponentNotes() {
		funkin.play.options.hideOpponentNotes = !funkin.play.options.hideOpponentNotes;
		this.saveOptions();
	}

	toggleLaneOpacity() {
		let currentOpacity = funkin.play.options.laneOpacity;
		currentOpacity += 0.1;
		if (currentOpacity > 1.05) currentOpacity = 0.1;
		
		funkin.play.options.laneOpacity = Math.round(currentOpacity * 10) / 10;
		this.saveOptions();
		this.refreshLayout();
	}

	checkHitboxVisibility() {
		if (funkin.play.options.middlescroll === "mobile") {
			if (this.scene.hitbox && typeof this.scene.hitbox.setVisible === 'function') {
				this.scene.hitbox.setVisible(false);
			}
		} else {
			if (this.scene.hitbox && typeof this.scene.hitbox.setVisible === 'function') {
				const isMobileDevice = /Mobi|Android/i.test(navigator.userAgent);
				const storedHitbox = localStorage.getItem("hitbox_enabled");
				if (storedHitbox === "true" || isMobileDevice) {
					this.scene.hitbox.setVisible(true);
				}
			}
		}
	}

	refreshLayout() {
		if (this.scene.strumlines && funkin.StrumlineLayout) {
			funkin.StrumlineLayout.updateLayout(this.scene.strumlines);
		}
	}

	destroy() {
		if (this.scene && this.scene.input && this.scene.input.keyboard) {
			this.scene.input.keyboard.off("keydown", this.keydownListener);
		}
		this.scene = null;
	}
}

if (typeof window !== "undefined") {
	window.funkin = window.funkin || {};
	funkin.ArrowModesDebug = ArrowModesDebug;
}