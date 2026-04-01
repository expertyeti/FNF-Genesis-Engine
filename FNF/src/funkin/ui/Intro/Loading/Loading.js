/**
 * Escena encargada de la carga inicial de recursos base del juego.
 * Implementa un sistema de carga dinámico dependiendo del entorno de ejecución.
 */
class Loading extends Phaser.Scene {
	constructor() {
		super('LoadingScene');

		this.loadingTheme = ''; // Tema dinámico que se cargará según el entorno
	}

	/**
	 * Prepara la interfaz de carga inicial y obtiene el entorno de ejecución.
	 */
	preload() {
		const currentEnvironment = window.funkin.device.get();

		if (currentEnvironment === 'web') {
			this.loadingTheme = 'web';
		} else {
			this.loadingTheme = 'clasical';
		}

		console.log(`Tema de carga aplicado: ${this.loadingTheme} (Entorno: ${currentEnvironment})`);

		const width = this.cameras.main.width;
		const height = this.cameras.main.height;

		const font = new FontFace('vcr', 'url(public/fonts/vcr.ttf)');

		document.fonts.add(font);
		font
			.load()
			.then(() => {
				if (this.loadingText) this.loadingText.setFontFamily('vcr');
				if (this.percentText) this.percentText.setFontFamily('vcr');
			})
			.catch(() => {
				console.warn('No se pudo cargar la fuente VCR en LoadingScene');
			});

		this.loadingContainer = this.add.container(width / 2, height / 2);

		this.loadingText = this.add
			.text(0, -40, 'LOADING...', {
				font: '32px Arial',
				fill: '#ffffff',
			})
			.setOrigin(0.5);

		this.percentText = this.add
			.text(0, 40, '0%', {
				font: '24px Arial',
				fill: '#ffffff',
			})
			.setOrigin(0.5);

		this.bgBar = this.add.graphics();
		this.bgBar.fillStyle(0x000000, 0.5);
		this.bgBar.lineStyle(2, 0xffffff, 1);
		this.bgBar.fillRect(-150, -10, 300, 20);
		this.bgBar.strokeRect(-150, -10, 300, 20);

		this.fillBar = this.add.graphics(); // Relleno visual progresivo

		this.loadingContainer.add([this.bgBar, this.fillBar, this.loadingText, this.percentText]);

		this.load.on('progress', (value) => {
			this.percentText.setText(parseInt(value * 100) + '%');
			this.fillBar.clear();
			this.fillBar.fillStyle(0xffffff, 1);
			this.fillBar.fillRect(-150, -10, 300 * value, 20);
		});

		Alphabet.load(this);
		this.load.json('introData', 'public/data/ui/intro.json');
		this.load.audio('freakyMenu', 'public/music/FreakyMenu.mp3');
		this.load.image('newgrounds', 'public/images/menu/intro/newgrounds_logo.png');
		this.load.text('randomText', 'public/data/ui/randomText.txt');
		this.load.atlasXML('gfDance', 'public/images/menu/intro/gfDanceTitle.png', 'public/images/menu/intro/gfDanceTitle.xml');
		this.load.atlasXML('logoBumpin', 'public/images/menu/intro/logoBumpin.png', 'public/images/menu/intro/logoBumpin.xml');
		this.load.atlasXML('titleEnter', 'public/images/menu/intro/titleEnter.png', 'public/images/menu/intro/titleEnter.xml');
	}

	/**
	 * Gestiona la transición al finalizar la carga de los recursos e inicializa la escena de texto.
	 */
	create() {
		this.tweens.add({
			targets: this.loadingContainer,
			alpha: 0,
			duration: 500,
			onComplete: () => {
				const scriptRelativePath = `public/images/ui/loading/${this.loadingTheme}/script.js`;
				const scriptPath = new URL(scriptRelativePath, document.baseURI).href;

				import(scriptPath)
					.then((module) => {
						module.default(this, () => {
							this.scene.start('IntroTextScene');
						});
					})
					.catch((error) => {
						console.error(`Error crítico al cargar el script dinámico de ${this.loadingTheme}:`, error);
						this.scene.start('IntroTextScene');
					});
			},
		});
	}
}

game.scene.add('LoadingScene', Loading, true);