/**
 * Controlador de input de la escena principal (pausa y modulos de debug).
 */
class PlayInput {
	/**
	 * @param {Phaser.Scene} scene Instancia de la escena activa donde operara el input
	 */
	constructor(scene) {
		this.scene = scene; 
		this.isTransitioning = false; 
		
		this.pauseDelay = true; 
		this.scene.time.delayedCall(300, () => { this.pauseDelay = false; });
		
		this.scene.events.on('resume', () => {
			this.pauseDelay = true;
			this.scene.time.delayedCall(300, () => { this.pauseDelay = false; });
		});

		this.prevPause = false; 
		this.prevAccept = false; 

		if (funkin.play && funkin.play.InputDebugg) {
			this.debugModule = new funkin.play.InputDebugg(scene);
		} else {
			console.log("InputDebugg no fue encontrado en el HTML.");
		}

		if (funkin.playDebugging && funkin.playDebugging.SimpleModeDebug) {
			this.simpleModeDebug = new funkin.playDebugging.SimpleModeDebug(scene);
		}
	}

	update() {
		if (!this.arrowsDebug && funkin.ArrowModesDebug) {
			this.arrowsDebug = new funkin.ArrowModesDebug(this.scene);
		}

		if (this.isTransitioning || this.scene.isGamePaused) return;
		
		if (this.debugModule && typeof this.debugModule.update === 'function') {
			this.debugModule.update();
		}

		if (!funkin.controls) return;

		const pauseHit = funkin.controls.PAUSE_P;
		const acceptHit = funkin.controls.ACCEPT_P;

		if (this.pauseDelay) {
			this.prevPause = pauseHit;
			this.prevAccept = acceptHit;
			return;
		}

		if ((pauseHit && !this.prevPause) || (acceptHit && !this.prevAccept)) {
			this.triggerPause();
		}

		this.prevPause = pauseHit;
		this.prevAccept = acceptHit;
	}

	/**
	 * Detiene la musica y levanta la sub-escena de pausa de la partida actual.
	 */
	triggerPause() {
		this.pauseDelay = true; 
		if (!this.scene.isGamePaused) {
			this.scene.isGamePaused = true;
			this.scene.sound.pauseAll();
			this.scene.scene.launch("PauseSubScene");
			this.scene.scene.pause("PlayScene");
		}
	}

	destroy() { 
		this.scene.events.off('resume');
		
		if (this.debugModule) {
			this.debugModule.destroy();
		}

		if (this.arrowsDebug) {
			this.arrowsDebug.destroy();
		}

		if (this.simpleModeDebug) {
			this.simpleModeDebug.destroy();
		}
	}
}

if (typeof window !== "undefined") {
	window.funkin = window.funkin || {};
	funkin.PlayInput = PlayInput;
}