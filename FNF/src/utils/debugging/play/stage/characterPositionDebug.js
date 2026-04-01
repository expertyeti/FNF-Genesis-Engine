/**
 * Herramienta de depuración visual para identificar las coordenadas de los personajes
 * leyendo las posiciones calculadas y expuestas por PropsCharacters.
 */
class CharacterPositionDebug {
	/**
	 * @param {Phaser.Scene} scene
	 */
	constructor(scene) {
		this.scene = scene;
		this.debugObjects = [];
		this.isVisible = false;

		this.colors = {
			boyfriend: 0x00ffff,
			girlfriend: 0xff00ff,
			opponent: 0xff0000
		};

		this.initKeys();
	}

	initKeys() {
		const f8Key = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F8);

		f8Key.on('down', () => {
			const isDebugActive = funkin.debugMode || (funkin.playDebugging && funkin.playDebugging.enabled);
			if (!isDebugActive) return;
			this.toggle();
		});
	}

	drawPositions() {
		if (!this.scene.debugCharacterPositions) {
			console.warn('No se han registrado posiciones de personajes en la escena mediante PropsCharacters.');
			return;
		}

		const positions = this.scene.debugCharacterPositions;
		let foundAny = false;

		Object.keys(positions).forEach(role => {
			const pos = positions[role];
			this.createMarker(role, pos.x, pos.y);
			foundAny = true;
		});

		if (!foundAny) {
			console.warn('El registro de posiciones de personajes está vacío.');
		}
	}

	/**
	 * @param {string} role 
	 * @param {number} targetX 
    	 * @param {number} targetY 
	 */
	createMarker(role, targetX, targetY) {
		let colorKey = 'boyfriend';
		const normalizedRole = role.toLowerCase();
		
		if (normalizedRole.includes('gf') || normalizedRole.includes('girl') || normalizedRole.includes('spectator')) {
			colorKey = 'girlfriend';
		} else if (normalizedRole.includes('dad') || normalizedRole.includes('opponent') || normalizedRole.includes('enemy') || normalizedRole.includes('boss')) {
			colorKey = 'opponent';
		}

		const roleColor = this.colors[colorKey];

		console.log(`Creado marcador para ${role} en X:${targetX}, Y:${targetY}`);

		// crosshair for base position. Ground level + center X.
		const markerSize = 80;
		const markerThickness = 4;
		const markerAlpha = 0.8;
        
        // Ground line (horizontal)
		const groundLine = this.scene.add.line(targetX, targetY, 0, 0, markerSize, 0, roleColor, markerAlpha);
		groundLine.setDepth(999999);
		groundLine.setScrollFactor(1);
		groundLine.setVisible(this.isVisible);
		groundLine.setOrigin(0.5); // Center on X, vertical center is Y

        // Vertical line up for center X.
		const verticalLine = this.scene.add.line(targetX, targetY, 0, 0, 0, markerSize / 2, roleColor, markerAlpha);
		verticalLine.setDepth(999999);
		verticalLine.setScrollFactor(1);
		verticalLine.setVisible(this.isVisible);
		verticalLine.setOrigin(0.5, 1); // Center on X, bottom is Y.

        // The circle as a reference for the base point is still useful.
		const debugCircle = this.scene.add.circle(targetX, targetY, markerSize / 4, roleColor, markerAlpha);
		debugCircle.setDepth(999999);
		debugCircle.setScrollFactor(1);
		debugCircle.setVisible(this.isVisible);

		const debugText = this.scene.add.text(targetX, targetY - markerSize / 1.5, role.toUpperCase(), {
			fontFamily: 'vcr, Arial, sans-serif',
			fontSize: '24px',
			color: '#ffffff',
			stroke: '#000000',
			strokeThickness: 4
		}).setOrigin(0.5, 1); // Center on X, bottom is Y (label is above ground level).
		
		debugText.setDepth(999999);
		debugText.setScrollFactor(1);
		debugText.setVisible(this.isVisible);

		this.debugObjects.push(groundLine, verticalLine, debugCircle, debugText);
	}

	toggle() {
		if (this.debugObjects.length === 0) {
			this.drawPositions();
		}

		if (this.debugObjects.length === 0) {
			console.warn('No hay objetos para mostrar. Asegúrate de que el stage contenga personajes instanciados.');
			return;
		}

		this.isVisible = !this.isVisible;
		this.debugObjects.forEach(obj => {
			if (obj && obj.active) {
				obj.setVisible(this.isVisible);
			}
		});
		
		console.log(`Indicadores de posición: ${this.isVisible ? 'VISIBLES' : 'OCULTAS'}`);
	}

	destroy() {
		this.debugObjects.forEach(obj => {
			if (obj && typeof obj.destroy === 'function') {
				obj.destroy();
			}
		});
		this.debugObjects = [];
	}
}

window.funkin = window.funkin || {};
funkin.playDebugging = funkin.playDebugging || {};
funkin.playDebugging.CharacterPositionDebug = CharacterPositionDebug;