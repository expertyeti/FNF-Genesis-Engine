class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: "MainMenuScene" });
        this.selectedIndex = 0;
        this.menuItems = [];
        this.canInteract = false;
        this.camFollow = null;
        this.flickerTimer = null;
        this.touchStartY = 0;
        this.isSwiping = false;
    }

    preload() {
        this.load.image('menuBackground', 'public/images/menu/bg/menuBG.png');
        this.load.image('menuFlash', 'public/images/menu/bg/menuBGMagenta.png'); 
        
        this.load.audio('selectSound', 'public/sounds/scrollMenu.ogg');
        this.load.audio('confirmSound', 'public/sounds/confirmMenu.ogg');
        this.load.audio('cancelSound', 'public/sounds/cancelMenu.ogg');
        this.load.audio("freakyMenu", "public/music/FreakyMenu.mp3");

        window.MainMenuOptions.preload(this);

        const font = new FontFace('vcr', 'url(public/fonts/vcr.ttf)');
        document.fonts.add(font);
        
        font.load().then(() => {
            if (this.sys && this.sys.isActive() && this.engineVersionUI && this.engineVersionUI.versionText && this.engineVersionUI.versionText.active) {
                this.engineVersionUI.versionText.setFontFamily('vcr');
            }
        }).catch(() => {});
    }

    create() {
        funkin.conductor.bpm.set(120);
        if (!this.sound.get('freakyMenu')) this.sound.add('freakyMenu');
        
        const music = this.sound.get('freakyMenu');
        if (music && !music.isPlaying) {
            music.play({ loop: true, volume: 0.7 });
        } else if (music && music.isPlaying && music.volume < 0.7) {
            this.tweens.add({ targets: music, volume: 0.7, duration: 1000 });
        }
        
        this.selectSound = this.sound.add('selectSound');
        this.confirmSound = this.sound.add('confirmSound');
        this.cancelSound = this.sound.add('cancelSound');

        const { width, height } = this.scale;
        const spriteData = window.MainMenuOptions.getSpriteData(width, height);

        // --- INICIALIZAR EL NUEVO GESTOR DEL FONDO ---
        this.bgManager = new window.MainMenuBackground(this, spriteData);
        
        // Referenciamos el flash para mantener compatibilidad con las lógicas de selección actuales
        this.menuFlash = this.bgManager.flashSprite;

        this.inputHandler = new window.MenuInputHandler(this);
        this.selectionLogic = new window.MainMenuSelection(this);

        this.menuItems = [];
        spriteData.items.forEach((data) => {
            this.menuItems.push(new window.MenuOptionSprite(this, data));
        });
        
        const screenCenterX = width / 2;
        this.camFollow = new Phaser.GameObjects.Zone(this, screenCenterX, this.menuItems[0].y, 1, 1);
        this.add.existing(this.camFollow);
        this.cameras.main.startFollow(this.camFollow, true, 0.08, 0.08);

        this.inputHandler.initControls();
        this.selectionLogic.updateSelection();

        if (!this.sys.game.device.os.desktop) {
            this.setupMobileControls();
        }
        
        this.cameras.main.fadeIn(250, 0, 0, 0, (cam, progress) => {
            if (progress === 1) this.canInteract = true;
        });

        if (window.MainMenuEngineVer) {
            this.engineVersionUI = new window.MainMenuEngineVer(this);
        }
    }

    update(time, delta) {
        if (funkin.controls) funkin.controls.update();

        // Actualizamos el fondo (parallax por giroscopio)
        if (this.bgManager) {
            this.bgManager.update();
        }

        if (this.canInteract && this.inputHandler) {
            this.inputHandler.update();
        }
    }

    setupMobileControls() {
        this.input.on('pointerdown', (pointer) => {
            this.touchStartY = pointer.y;
            this.isSwiping = false;
        });

        this.input.on('pointermove', (pointer) => {
            if (!pointer.isDown || !this.canInteract) return;

            const diffY = pointer.y - this.touchStartY;
            if (Math.abs(diffY) > 70) {
                this.isSwiping = true; 
                this.selectionLogic.changeSelection(diffY < 0 ? 1 : -1);
                this.touchStartY = pointer.y;
            }
        });

        this.menuItems.forEach((item, index) => {
            item.setInteractive(); 
            item.on('pointerup', () => {
                if (!this.isSwiping) this.selectionLogic.handleTouch(index);
                this.isSwiping = false;
            });
        });
    }

    shutdown() {
        if (this.bgManager) {
            this.bgManager.destroy();
            this.bgManager = null;
        }
        if (this.inputHandler) {
            this.inputHandler.destroy();
            this.inputHandler = null;
        }
        if (this.selectionLogic) {
            this.selectionLogic.destroy();
            this.selectionLogic = null;
        }
        if (this.flickerTimer) {
            this.flickerTimer.remove();
            this.flickerTimer = null;
        }

        this.input.off('pointerdown');
        this.input.off('pointermove');
        this.menuItems.forEach(item => item.off('pointerup'));
        
        this.menuItems = [];
        this.canInteract = false;
        this.camFollow = null;
    }
}

window.game.scene.add("MainMenuScene", MainMenuScene);