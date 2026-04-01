
/**
 * Monitor de FPS, memoria y utilidades de desarrollo.
 */
class DevToolsMonitor {
	constructor() {
		if (!window.pluginsEventBus) {
			window.pluginsEventBus = new Phaser.Events.EventEmitter();
		}

		window.pluginsEventBus.on('init_plugins', this.init, this);

		this.scene = null;
		this.visible = false;
		this.minimized = true;
		this.posX = '20px'; // Posición horizontal guardada
		this.posY = '20px'; // Posición vertical guardada

		this.fpsHistory = [];
		this.maxHistory = 60;
		this.maxFpsGraph = 240;
		this.lastDOMUpdate = 0;

		this.frameCount = 0;
		this.lastFpsTime = 0;
		this.currentFps = 0;

		this.baseWidth = 250;
		this.baseHeight = 140;

		this.originalTargetFps = 60;
	}

	/**
	 * Inicializa el monitor de forma asíncrona, cargando la configuración antes de crear el DOM.
	 * @param {Phaser.Scene} scene 
	 */
	async init(scene) {
		this.scene = scene;

		const isMobile =
			this.scene.sys.game.device.os.android ||
			this.scene.sys.game.device.os.iOS ||
			this.scene.sys.game.device.os.ipad ||
			this.scene.sys.game.device.os.iphone ||
			!this.scene.sys.game.device.os.desktop;

		if (isMobile) return;

		this.originalTargetFps = this.scene.game.loop.targetFps || 60;

		await this._loadStorage();

		this._injectFontAwesome();
		this._createDOM();
		this._createMiniDOM();
		this._updateUI();

		this.scene.events.on('update', this.update, this);

		window.addEventListener('keydown', (e) => {
			if (e.key === 'F3') {
				e.preventDefault();
				this.toggleVisibility();
			}
		});

		document.addEventListener('visibilitychange', () => {
			if (document.hidden) {
				this.scene.game.loop.targetFps = 20;
			} else {
				this.scene.game.loop.targetFps = this.originalTargetFps;
			}
		});
	}

	/**
	 * Espera la carga de la configuración desde funkin.storage.
	 */
	async _loadStorage() {
		try {
			if (window.funkin && window.funkin.storage) {
				const rawData = await window.funkin.storage.get('devtools');
				
				if (rawData) {
					const devData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
					
					this.visible = devData.visible !== undefined ? devData.visible : false;
					this.minimized = devData.minimized !== undefined ? devData.minimized : true;
					
					const rawX = devData.x !== undefined ? String(devData.x) : '20px';
					const rawY = devData.y !== undefined ? String(devData.y) : '20px';
					
					this.posX = rawX.endsWith('px') ? rawX : `${rawX}px`;
					this.posY = rawY.endsWith('px') ? rawY : `${rawY}px`;
				}
			}
		} catch (error) {
			console.warn('Error leyendo el storage de DevTools, aplicando valores por defecto.', error);
			this.visible = false;
			this.minimized = true;
			this.posX = '20px';
			this.posY = '20px';
		}
	}

	/**
	 * Guarda el estado actual en funkin.storage emulando la lógica de SoundTrayLogic.
	 */
	_saveStorage() {
		try {
			const activeElement = this.minimized ? this.miniUI : this.container;

			if (activeElement) {
				this.posX = activeElement.style.left || this.posX;
				this.posY = activeElement.style.top || this.posY;
			}

			const data = {
				visible: this.visible,
				minimized: this.minimized,
				x: this.posX,
				y: this.posY
			};

			if (window.funkin && window.funkin.storage && window.funkin.storage.save) {
				window.funkin.storage.save('devtools', JSON.stringify(data));
			}
		} catch (error) {
			console.warn('Fallo al guardar DevTools en Web Storage', error);
		}
	}

	/**
	 * Inyecta la hoja de estilos requerida para los iconos de la cabecera.
	 */
	_injectFontAwesome() {
		if (!document.getElementById('font-awesome-dev')) {
			const link = document.createElement('link');
			link.id = 'font-awesome-dev';
			link.rel = 'stylesheet';
			link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
			document.head.appendChild(link);
		}
	}

	/**
	 * Construye el panel principal expandido del monitor.
	 */
	_createDOM() {
		this.container = document.createElement('div');
		Object.assign(this.container.style, {
			position: 'absolute',
			top: this.posY,
			left: this.posX,
			width: `${this.baseWidth}px`,
			height: `${this.baseHeight}px`,
			minWidth: '150px',
			minHeight: '80px',
			backgroundColor: 'rgba(0, 0, 0, 0.6)',
			backdropFilter: 'blur(5px)',
			border: '1px solid #FFFFFF',
			borderRadius: '8px',
			color: '#FFFFFF',
			fontFamily: '"vcr", monospace',
			zIndex: '99999',
			display: 'none',
			flexDirection: 'column',
			boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
			userSelect: 'none',
			overflow: 'hidden',
			resize: 'both'
		});

		this.header = document.createElement('div');
		Object.assign(this.header.style, {
			height: '25px',
			cursor: 'move',
			display: 'flex',
			justifyContent: 'space-between',
			alignItems: 'center',
			padding: '0 10px',
			borderBottom: '1px solid #FFFFFF',
			backgroundColor: '#000000'
		});

		const titleLabel = document.createElement('span');
		titleLabel.innerText = 'DevTools';
		titleLabel.style.fontSize = '12px';
		this.header.appendChild(titleLabel);

		const controlsDiv = document.createElement('div');
		Object.assign(controlsDiv.style, {
			display: 'flex',
			gap: '15px',
			alignItems: 'center'
		});

		this.btnMin = document.createElement('i');
		this.btnMin.className = 'fas fa-minus';
		Object.assign(this.btnMin.style, {
			cursor: 'pointer',
			fontSize: '12px',
			color: '#FFFFFF'
		});
		this.btnMin.onclick = () => this.toggleMinimize();

		this.btnClose = document.createElement('i');
		this.btnClose.className = 'fas fa-times';
		Object.assign(this.btnClose.style, {
			cursor: 'pointer',
			fontSize: '14px',
			color: '#FFFFFF'
		});
		this.btnClose.onclick = () => {
			this.visible = false;
			this._updateUI();
			this._saveStorage();
		};

		controlsDiv.appendChild(this.btnMin);
		controlsDiv.appendChild(this.btnClose);
		this.header.appendChild(controlsDiv);

		this.bodyContainer = document.createElement('div');
		Object.assign(this.bodyContainer.style, {
			padding: '10px',
			display: 'flex',
			flexDirection: 'column',
			gap: '5px',
			flexGrow: '1'
		});

		this.fpsText = document.createElement('div');
		this.fpsText.innerText = 'FPS: 0';
		Object.assign(this.fpsText.style, {
			fontWeight: 'bold',
			fontSize: '16px',
			textShadow: '1px 1px 0 #000'
		});

		this.graphCanvas = document.createElement('canvas');
		this.graphCanvas.width = 230;
		this.graphCanvas.height = 40;
		Object.assign(this.graphCanvas.style, {
			width: '100%',
			height: '40px',
			backgroundColor: '#000000',
			borderRadius: '4px',
			border: '1px solid #FFFFFF'
		});

		this.memText = document.createElement('div');
		this.memText.innerText = 'MEM: 0 MB';
		Object.assign(this.memText.style, {
			fontSize: '12px',
			color: '#FFFFFF'
		});

		this.bodyContainer.appendChild(this.fpsText);
		this.bodyContainer.appendChild(this.graphCanvas);
		this.bodyContainer.appendChild(this.memText);

		this.container.appendChild(this.header);
		this.container.appendChild(this.bodyContainer);

		const gameParent = this.scene.game.canvas.parentElement || document.body;
		if (gameParent !== document.body) {
			gameParent.style.position = 'relative';
		}
		gameParent.appendChild(this.container);

		this._makeDraggable(this.container, this.header);
	}

	/**
	 * Construye la versión reducida (sigilosa) del monitor.
	 */
	_createMiniDOM() {
		this.miniUI = document.createElement('div');

		Object.assign(this.miniUI.style, {
			position: 'absolute',
			top: this.posY,
			left: this.posX,
			padding: '4px 8px',
			backgroundColor: 'rgba(0, 0, 0, 0.5)',
			backdropFilter: 'blur(3px)',
			border: 'none',
			borderRadius: '0px',
			boxShadow: 'none',
			color: '#FFFFFF',
			fontFamily: '"vcr", monospace',
			fontWeight: 'bold',
			fontSize: '14px',
			cursor: 'pointer',
			zIndex: '99999',
			display: 'none',
			userSelect: 'none'
		});

		this.miniUI.innerText = 'FPS: 0';

		const gameParent = this.scene.game.canvas.parentElement || document.body;
		gameParent.appendChild(this.miniUI);

		this._makeDraggable(this.miniUI, this.miniUI, () => this.toggleMinimize());
	}

	/**
	 * Permite arrastrar un elemento HTML libremente respetando los límites de su contenedor.
	 * @param {HTMLElement} element
	 * @param {HTMLElement} handle
	 * @param {Function|null} onClickCallback
	 */
	_makeDraggable(element, handle, onClickCallback = null) {
		let pos1 = 0,
			pos2 = 0,
			pos3 = 0,
			pos4 = 0;
		let isDrag = false;

		handle.onmousedown = (e) => {
			if (e.target.tagName === 'I') return;

			e.preventDefault();
			isDrag = false;
			pos3 = e.clientX;
			pos4 = e.clientY;

			const onMouseUp = () => {
				document.removeEventListener('mouseup', onMouseUp);
				document.removeEventListener('mousemove', onMouseMove);

				if (!isDrag && onClickCallback) {
					onClickCallback();
				}

				this._saveStorage();
			};

			const onMouseMove = (e) => {
				isDrag = true;
				e.preventDefault();

				pos1 = pos3 - e.clientX;
				pos2 = pos4 - e.clientY;
				pos3 = e.clientX;
				pos4 = e.clientY;

				let newTop = element.offsetTop - pos2;
				let newLeft = element.offsetLeft - pos1;

				const parent = element.parentElement;
				const maxX = parent.clientWidth - element.offsetWidth;
				const maxY = parent.clientHeight - element.offsetHeight;

				newLeft = Math.max(0, Math.min(newLeft, maxX));
				newTop = Math.max(0, Math.min(newTop, maxY));

				element.style.top = newTop + 'px';
				element.style.left = newLeft + 'px';
			};

			document.addEventListener('mouseup', onMouseUp);
			document.addEventListener('mousemove', onMouseMove);
		};
	}

	/**
	 * Alterna la visibilidad global del monitor en la pantalla.
	 */
	toggleVisibility() {
		this.visible = !this.visible;
		this._updateUI();
		this._saveStorage();
	}

	/**
	 * Alterna entre la vista completa con gráfica y la vista reducida.
	 */
	toggleMinimize() {
		this.minimized = !this.minimized;

		if (this.minimized) {
			this.miniUI.style.left = this.container.style.left;
			this.miniUI.style.top = this.container.style.top;
		} else {
			this.container.style.left = this.miniUI.style.left;
			this.container.style.top = this.miniUI.style.top;
		}

		this._updateUI();
		this._saveStorage();
	}

	/**
	 * Sincroniza los estilos display del DOM de acuerdo al estado interno.
	 */
	_updateUI() {
		if (!this.visible) {
			this.container.style.display = 'none';
			this.miniUI.style.display = 'none';
		} else {
			if (this.minimized) {
				this.container.style.display = 'none';
				this.miniUI.style.display = 'block';
			} else {
				this.miniUI.style.display = 'none';
				this.container.style.display = 'flex';
			}
		}
	}

	/**
	 * Consulta y formatea el uso de memoria actual de la pestaña.
	 * @returns {{used: number, total: number}}
	 */
	getMemoryUsage() {
		if (window.performance && window.performance.memory) {
			return {
				used: Math.round(window.performance.memory.usedJSHeapSize / 1048576),
				total: Math.round(window.performance.memory.totalJSHeapSize / 1048576)
			};
		}
		return { used: 0, total: 0 };
	}

	/**
	 * Bucle de actualización atado al ciclo de renderizado de la escena base.
	 * @param {number} time
	 * @param {number} delta
	 */
	update(time, delta) {
		this.frameCount++;

		if (time >= this.lastFpsTime + 1000) {
			this.currentFps = Math.round((this.frameCount * 1000) / (time - this.lastFpsTime));
			this.frameCount = 0;
			this.lastFpsTime = time;
		}

		if (!this.visible) return;

		if (time > this.lastDOMUpdate + 100) {
			this.fpsHistory.push(this.currentFps);
			if (this.fpsHistory.length > this.maxHistory) {
				this.fpsHistory.shift();
			}

			const mem = this.getMemoryUsage();

			if (this.minimized) {
				this.miniUI.innerText = `FPS: ${this.currentFps}`;
			} else {
				this.fpsText.innerText = `FPS: ${this.currentFps}`;
				this.memText.innerText = `MEM: ${mem.used} MB`;
				this._drawGraph();
			}

			this.lastDOMUpdate = time;
		}
	}

	/**
	 * Traza los picos de historia de cuadros por segundo en el canvas del panel completo.
	 */
	_drawGraph() {
		const ctx = this.graphCanvas.getContext('2d');
		const w = this.graphCanvas.width;
		const h = this.graphCanvas.height;

		ctx.clearRect(0, 0, w, h);

		ctx.beginPath();
		ctx.strokeStyle = '#FFFFFF';
		ctx.lineWidth = 2;

		const step = w / (this.maxHistory - 1);

		for (let i = 0; i < this.fpsHistory.length; i++) {
			const y = h - (this.fpsHistory[i] / this.maxFpsGraph) * h;
			const x = i * step;

			if (i === 0) {
				ctx.moveTo(x, y);
			} else {
				ctx.lineTo(x, y);
			}
		}

		ctx.stroke();
	}
}

if (window.pluginsEventBus) {
	window.devToolsMonitorPlugin = new DevToolsMonitor();
}