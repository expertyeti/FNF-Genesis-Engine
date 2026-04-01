/**
 * @file src/funkin/play/data/playScene/anti-lag.js
 * Sistema dinámico para detectar congelamientos (lag) y aplicar el suavizado de la curva de tiempo (Smooth Fix).
 */
class AntiLagSystem {
	/**
	 * @param {Phaser.Scene} scene - La escena donde operará el sistema.
	 */
	constructor(scene) {
		this.scene = scene;
		this.lagThreshold = 150; // Límite en milisegundos para considerar que hubo lag
		this.isEnabled = true;
		this.isRecovering = false; // Seguro lógico para evitar el spam en la consola durante el lag
		this.currentRate = 1.0; // Multiplicador de velocidad de recuperación

		console.log('Sistema Anti-Lag Inicializado con Smooth Fix.');
	}

	/**
	 * Se ejecuta en cada frame para evaluar el delta y ajustar la velocidad temporal de Phaser.
	 * @param {number} time - Tiempo transcurrido absoluto de la escena.
	 * @param {number} delta - Milisegundos transcurridos desde el último frame.
	 */
	update(time, delta) {
		if (!this.isEnabled || !funkin.songPlaylist || !funkin.conductor) return;

		if (delta > this.lagThreshold) {
			// El condicional evita la espiral de muerte limitando la carga de la consola
			if (!this.isRecovering) {
				console.warn(`Caída de FPS detectada (${Math.round(delta)}ms). Aplicando Smooth Fix (0.8x)...`);
			}

			this.currentRate = 0.8;
			this.isRecovering = true;
			this.setGameRate(this.currentRate);
		} else if (this.isRecovering) {
			if (delta < 35) {
				this.currentRate += 0.05 * (delta / 1000);

				if (this.currentRate >= 1.0) {
					this.currentRate = 1.0;
					this.isRecovering = false;
					console.log('Estabilidad recuperada. Velocidad restaurada a 1.0x.');
				}

				this.setGameRate(this.currentRate);
			}
		}
	}

	/**
	 * Aplica un multiplicador de velocidad a los sonidos, animaciones y tweens activos.
	 * @param {number} newRate - Multiplicador de velocidad temporal (1.0 = velocidad normal).
	 */
	setGameRate(newRate) {
		if (funkin.songPlaylist && funkin.songPlaylist.activeSounds) {
			funkin.songPlaylist.activeSounds.forEach((sound) => {
				if (sound && sound.isPlaying) {
					sound.setRate(newRate);
				}
			});
		}

		if (this.scene) {
			if (this.scene.anims) this.scene.anims.globalTimeScale = newRate;
			if (this.scene.tweens) this.scene.tweens.timeScale = newRate;
			if (this.scene.time) this.scene.time.timeScale = newRate;
		}
	}

	/**
	 * Alterna el estado de activación del sistema anti-lag.
	 * @param {boolean} [state] - Fuerza un estado específico. Si se omite, se invierte el estado actual.
	 */
	toggle(state) {
		this.isEnabled = state !== undefined ? state : !this.isEnabled;

		if (!this.isEnabled) {
			this.setGameRate(1.0);
			this.isRecovering = false;
		}
	}

	/**
	 * Restaura la velocidad del motor y elimina las referencias para el colector de basura.
	 */
	destroy() {
		this.setGameRate(1.0);
		this.scene = null;
	}
}

if (typeof window !== 'undefined') {
	funkin.AntiLagSystem = AntiLagSystem;
}