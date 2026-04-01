/**
 * Herramienta de depuracion para controlar el estado y progreso de la cancion en tiempo real.
 */
class SongDebugger {
	/**
	 * @param {Phaser.Scene} scene Escena activa de Phaser
	 */
	constructor(scene) {
		this.scene = scene;
		this.speedStep = 0.1; 
		this.timeStep = 10;   

		this.scene.events.once('shutdown', this.destroy, this);
		this.setupKeys();
	}

	/**
	 * Configura los atajos de teclado para la manipulacion del track
	 */
	setupKeys() {
		this.keyHandler = (e) => {
			if (e.shiftKey && (e.key === 'r' || e.key === 'R')) {
				this.restartSong();
				return;
			}

			const key = e.key;
			if (['1', '2', '3', '4', '7', '8'].includes(key)) {
				
				if (!funkin.debugMode) {
					console.log("¡El Modo Debug está DESACTIVADO! Presiona CTRL + ALT + SHIFT + D para activarlo.");
					return;
				}
				
				switch (key) {
					case '1': this.changeSpeed(-this.speedStep); break;
					case '2': this.changeSpeed(this.speedStep); break;
					case '3': this.changeTime(-this.timeStep); break;
					case '4': this.changeTime(this.timeStep); break;
					case '7': this.changePlaylistSong(-1); break;
					case '8': this.changePlaylistSong(1); break;
				}
			}
		};

		window.addEventListener('keydown', this.keyHandler);
	}

	/**
	 * Reinicia la escena por completo para limpiar la pista, notas y restaurar animaciones.
	 */
	restartSong() {
		if (this.scene && this.scene.scene) {
			console.log("Reiniciando la canción y restaurando la partida...");
			this.scene.sound.stopAll();
			
			if (funkin.PlayDataPayload) {
				this.scene.scene.restart(funkin.PlayDataPayload);
			} else {
				this.scene.scene.restart();
			}
		}
	}

	/**
	 * Modifica la velocidad global del juego (Pitch y animaciones)
	 * @param {number} amount Cantidad a modificar
	 */
	changeSpeed(amount) {
		let newRate = 1.0;
		let rateChanged = false;

		const playingSounds = this.scene.sound.getAllPlaying();
		
		playingSounds.forEach(sound => {
			let currentRate = typeof sound.rate === 'number' ? sound.rate : 1.0;
			newRate = currentRate + amount;
			newRate = Phaser.Math.Clamp(newRate, 0.1, 3.0);
			
			if (typeof sound.setRate === 'function') {
				sound.setRate(newRate);
			} else {
				sound.rate = newRate;
			}
			rateChanged = true;
		});

		if (rateChanged && this.scene) {
			if (this.scene.anims) this.scene.anims.globalTimeScale = newRate;
			if (this.scene.tweens) this.scene.tweens.timeScale = newRate;
			if (this.scene.time) this.scene.time.timeScale = newRate;
			console.log(`Velocidad general (Pitch, Audio y Animaciones) ajustada a: ${newRate.toFixed(2)}x`);
		}
	}

	/**
	 * Modifica el tiempo actual de reproduccion
	 * @param {number} amount Segundos a adelantar o atrasar
	 */
	changeTime(amount) {
		let newTimeSet = -1;
		const playingSounds = this.scene.sound.getAllPlaying();

		playingSounds.forEach(sound => {
			let currentSeek = sound.seek || 0;
			let newTime = currentSeek + amount;
			newTime = Phaser.Math.Clamp(newTime, 0, sound.duration || 0);
			
			if (typeof sound.setSeek === 'function') {
				sound.setSeek(newTime);
			} else {
				sound.seek = newTime;
			}
			newTimeSet = newTime;
		});
		
		if (newTimeSet !== -1 && funkin.conductor) {
			funkin.conductor.songPosition = newTimeSet * 1000;
			console.log(`Tiempo de la canción ajustado a: ${newTimeSet.toFixed(2)}s`);
		}
	}

	/**
	 * Avanza o retrocede en la lista de reproduccion actual
	 * @param {number} direction -1 para anterior, 1 para siguiente
	 */
	changePlaylistSong(direction) {
		if (!this.scene.playData || !this.scene.playData.songPlayList) return;

		const currentList = this.scene.playData.songPlayList;
		const currentIndex = currentList.indexOf(this.scene.playData.actuallyPlaying);

		if (currentIndex !== -1) {
			let newIndex = currentIndex + direction;
			
			if (newIndex >= 0 && newIndex < currentList.length) {
				const nextSong = currentList[newIndex];
				
				this.scene.playData.actuallyPlaying = nextSong;
				funkin.PlayDataPayload = JSON.parse(JSON.stringify(this.scene.playData));
				
				if (funkin.songPlaylist) {
					funkin.songPlaylist.stop();
				}

				console.log(`Cambiando de canción a: ${nextSong}`);
				this.scene.scene.restart();
			} else {
				console.log("No hay más canciones en la playlist en esa dirección.");
			}
		}
	}

	/**
	 * Limpia el listener de eventos al destruir
	 */
	destroy() {
		window.removeEventListener('keydown', this.keyHandler);
	}
}

if (typeof window !== "undefined") {
	window.funkin = window.funkin || {};
	funkin.SongDebugger = SongDebugger;
}