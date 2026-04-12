window.funkin = window.funkin || {};

class ArrowModesDebug {
	constructor(scene) {
		this.scene = scene;

		window.funkin.play = window.funkin.play || {};
		window.funkin.play.options = window.funkin.play.options || {};
		const options = window.funkin.play.options;

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
            const storedSchedule = localStorage.getItem("fnf_mobileSchedule"); 
            const stored2P = localStorage.getItem("fnf_twoPlayerLocal");

			if (storedDown !== null) options.downscroll = storedDown === "true";
			if (storedMid !== null) {
				if (storedMid === "true") options.middlescroll = true;
				else if (storedMid === "false") options.middlescroll = false;
				else options.middlescroll = storedMid;
			}
			if (storedBg !== null) options.strumlineBg = storedBg === "true";
			if (storedGhost !== null) options.ghostTapping = storedGhost === "true";
			if (storedOpponent !== null) options.playAsOpponent = storedOpponent === "true";
			if (storedPopup !== null) options.popupMode = storedPopup;
			if (storedMovePopup !== null) options.movePopUp = storedMovePopup;
			if (storedHideEnemy !== null) options.hideOpponentNotes = storedHideEnemy === "true";
			if (storedOpacity !== null) options.laneOpacity = parseFloat(storedOpacity);
            if (storedSchedule !== null) options.mobileSchedule = storedSchedule;
            if (stored2P !== null) options.twoPlayerLocal = stored2P === "true";
		} catch (error) {}

		if (options.downscroll === undefined) options.downscroll = false;
		if (options.middlescroll === undefined) options.middlescroll = false;
		if (options.strumlineBg === undefined) options.strumlineBg = false;
		if (options.ghostTapping === undefined) options.ghostTapping = true;
		if (options.playAsOpponent === undefined) options.playAsOpponent = false;
		if (options.popupMode === undefined) options.popupMode = "normal";
		if (options.movePopUp === undefined) options.movePopUp = "always";
		if (options.hideOpponentNotes === undefined) options.hideOpponentNotes = false;
		if (options.laneOpacity === undefined) options.laneOpacity = 0.5;
        if (options.mobileSchedule === undefined) options.mobileSchedule = "arrow"; 
        
        if (window.funkin.mobile) options.twoPlayerLocal = false;
        else if (options.twoPlayerLocal === undefined) options.twoPlayerLocal = false; 
        
        window.funkin.showArrowBounds = window.funkin.showArrowBounds || false;

		this.keydownListener = (event) => {
            // El atajo F2 para 2 jugadores ahora funciona SIEMPRE, sin requerir Debug ni ALT
            if (event.code === "F2" && !window.funkin.mobile) {
                this.toggleTwoPlayerLocal();
                return;
            }

            // Los demás atajos sí requieren Debug y ALT
            if (!window.funkin.debugMode || !event.altKey) return;

			if (event.code === "KeyD") this.toggleDownscroll();
			if (event.code === "KeyM") this.toggleMiddleScroll();
			if (event.code === "KeyL") this.toggleBackground();
			if (event.code === "KeyG") this.toggleGhostTapping();
			if (event.code === "KeyE") this.togglePlayAsOpponent();
			if (event.code === "KeyU") this.togglePopupMode();
			if (event.code === "KeyP") this.toggleMovePopUp();
			if (event.code === "KeyV") this.toggleOpponentNotes();
			if (event.code === "KeyO") this.toggleLaneOpacity();
            if (event.code === "KeyY" && window.funkin.mobile) this.toggleMobileSchedule();
            if (event.code === "KeyQ" && event.shiftKey) this.toggleArrowHitboxBounds();
		};

		if (this.scene && this.scene.input && this.scene.input.keyboard) {
			this.scene.input.keyboard.on("keydown", this.keydownListener);
		}

		this.checkHitboxVisibility();
	}

	saveOptions() {
		const options = window.funkin.play.options;
		try {
			localStorage.setItem("fnf_downscroll", options.downscroll);
			localStorage.setItem("fnf_middlescroll", options.middlescroll);
			localStorage.setItem("fnf_strumlineBg", options.strumlineBg);
			localStorage.setItem("fnf_ghostTapping", options.ghostTapping);
			localStorage.setItem("fnf_playAsOpponent", options.playAsOpponent);
			localStorage.setItem("fnf_popupMode", options.popupMode);
			localStorage.setItem("fnf_movePopUp", options.movePopUp);
			localStorage.setItem("fnf_hideOpponentNotes", options.hideOpponentNotes);
			localStorage.setItem("fnf_laneOpacity", options.laneOpacity);
            localStorage.setItem("fnf_mobileSchedule", options.mobileSchedule);
            localStorage.setItem("fnf_twoPlayerLocal", options.twoPlayerLocal);
		} catch (error) {}
	}

    toggleTwoPlayerLocal() {
        if (window.funkin.mobile) return;
        window.funkin.play.options.twoPlayerLocal = !window.funkin.play.options.twoPlayerLocal;
        if (funkin.play.data && funkin.play.data.TwoPlayerLocal) {
            funkin.play.data.TwoPlayerLocal.init();
        }
        console.log("TwoPlayerLocal: " + window.funkin.play.options.twoPlayerLocal);
        this.saveOptions();
    }

    toggleMobileSchedule() {
        const modes = ["arrow", "hitbox"];
        let currentIndex = modes.indexOf(window.funkin.play.options.mobileSchedule);
        if (currentIndex === -1) currentIndex = 0;
        currentIndex = (currentIndex + 1) % modes.length;
        window.funkin.play.options.mobileSchedule = modes[currentIndex];
        console.log("Mobile Schedule: " + modes[currentIndex]);
        this.saveOptions();
        this.refreshLayout();
        this.checkHitboxVisibility();
    }

    toggleArrowHitboxBounds() {
        window.funkin.showArrowBounds = !window.funkin.showArrowBounds;
        console.log("Arrow Hitbox Bounds: " + window.funkin.showArrowBounds);
        this.refreshLayout();
    }

	toggleDownscroll() {
		window.funkin.play.options.downscroll = !window.funkin.play.options.downscroll;
		console.log("Downscroll: " + window.funkin.play.options.downscroll);
		this.saveOptions();
		this.refreshLayout();
	}

	toggleMiddleScroll() {
		const modes = [false, true, "narrow", "wide", "split"];
		let currentIndex = modes.indexOf(window.funkin.play.options.middlescroll);

		if (currentIndex === -1) currentIndex = 0;
		currentIndex = (currentIndex + 1) % modes.length;

		window.funkin.play.options.middlescroll = modes[currentIndex];
		console.log("Middlescroll Mode: " + modes[currentIndex]);
		this.saveOptions();
		this.refreshLayout();
		this.checkHitboxVisibility();
	}

	toggleBackground() {
		window.funkin.play.options.strumlineBg = !window.funkin.play.options.strumlineBg;
		console.log("Strumline Background: " + window.funkin.play.options.strumlineBg);
		this.saveOptions();
		this.refreshLayout();
	}

	toggleGhostTapping() {
		window.funkin.play.options.ghostTapping = !window.funkin.play.options.ghostTapping;
		console.log("Ghost Tapping: " + window.funkin.play.options.ghostTapping);
		this.saveOptions();
		this.refreshLayout();
	}

	togglePlayAsOpponent() {
		window.funkin.play.options.playAsOpponent = !window.funkin.play.options.playAsOpponent;
		console.log("Play As Opponent: " + window.funkin.play.options.playAsOpponent);
		this.saveOptions();
		this.refreshLayout();
	}

	togglePopupMode() {
		const modes = ["normal", "stacking", "bubble"];
		let currentIndex = modes.indexOf(window.funkin.play.options.popupMode);
		if (currentIndex === -1) currentIndex = 0;
		currentIndex = (currentIndex + 1) % modes.length;
		window.funkin.play.options.popupMode = modes[currentIndex];
		console.log("Popup Mode: " + modes[currentIndex]);
		this.saveOptions();
	}

	toggleMovePopUp() {
		const modes = ["always", "middlescroll", "never"];
		let currentIndex = modes.indexOf(window.funkin.play.options.movePopUp);
		if (currentIndex === -1) currentIndex = 0;
		currentIndex = (currentIndex + 1) % modes.length;
		window.funkin.play.options.movePopUp = modes[currentIndex];
		console.log("Move Popup: " + modes[currentIndex]);
		this.saveOptions();
	}

	toggleOpponentNotes() {
		window.funkin.play.options.hideOpponentNotes = !window.funkin.play.options.hideOpponentNotes;
		console.log("Hide Opponent Notes: " + window.funkin.play.options.hideOpponentNotes);
		this.saveOptions();
	}

	toggleLaneOpacity() {
		let currentOpacity = window.funkin.play.options.laneOpacity;
		currentOpacity += 0.1;
		if (currentOpacity > 1.05) currentOpacity = 0.1;
		window.funkin.play.options.laneOpacity = Math.round(currentOpacity * 10) / 10;
		console.log("Lane Opacity: " + window.funkin.play.options.laneOpacity);
		this.saveOptions();
		this.refreshLayout();
	}

	checkHitboxVisibility() {
		if (this.scene.hitbox && typeof this.scene.hitbox.setVisible === 'function') {
            const sched = window.funkin.play.options.mobileSchedule || "arrow";
            const isMobileStrums = window.funkin.mobile && !window.funkin.isKeyboardActive && sched === "arrow";
			if (isMobileStrums) {
				this.scene.hitbox.setVisible(false);
			} else {
				const storedHitbox = localStorage.getItem("hitbox_enabled");
				if (storedHitbox === "true" || window.funkin.mobile) {
					this.scene.hitbox.setVisible(true);
				}
			}
		}
	}

	refreshLayout() {
		const strumlinesNamespace = window.funkin.play.visuals && window.funkin.play.visuals.arrows && window.funkin.play.visuals.arrows.strumlines;
		const LayoutClass = (strumlinesNamespace && strumlinesNamespace.StrumlineLayout) || window.funkin.StrumlineLayout;
		
		if (this.scene.strumlines && LayoutClass) {
			LayoutClass.updateLayout(this.scene.strumlines);
		}
	}

	destroy() {
		if (this.scene && this.scene.input && this.scene.input.keyboard) {
			this.scene.input.keyboard.off("keydown", this.keydownListener);
		}
		this.scene = null;
	}
}

window.funkin.ArrowModesDebug = ArrowModesDebug;