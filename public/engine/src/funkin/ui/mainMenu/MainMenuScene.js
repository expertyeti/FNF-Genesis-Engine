/**
 * @file MainMenuScene.js
 * Escena principal del menú de Genesis Engine.
 */
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
        this.load.imageBitmapFormat = true;
        this.load.image('menuBackground', window.BASE_URL + 'assets/images/menu/bg/menuBG.png');
        this.load.image('menuFlash', window.BASE_URL + 'assets/images/menu/bg/menuBGMagenta.png'); 
        this.load.audio('selectSound', window.BASE_URL + 'assets/sounds/scrollMenu.ogg');
        this.load.audio('confirmSound', window.BASE_URL + 'assets/sounds/confirmMenu.ogg');
        this.load.audio('cancelSound', window.BASE_URL + 'assets/sounds/cancelMenu.ogg');
        this.load.audio("freakyMenu", window.BASE_URL + "assets/music/FreakyMenu.mp3");

        funkin.ui.mainMenu.MainMenuOptions.preload(this);

        const font = new FontFace('vcr', `url(${window.BASE_URL}assets/fonts/vcr.ttf)`);
        document.fonts.add(font);
        
        font.load().then(() => {
            if (this.sys?.isActive() && this.engineVersionUI?.versionText?.active) {
                this.engineVersionUI.versionText.setFontFamily('vcr');
            }
        }).catch(() => {});
    }

    create() {
        if (funkin.conductor) funkin.conductor.bpm.set(120);
        
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
        const spriteData = funkin.ui.mainMenu.MainMenuOptions.getSpriteData(width, height);

        this.bgManager = new funkin.ui.mainMenu.MainMenuBackground(this, spriteData);
        this.menuFlash = this.bgManager.flashSprite;
        this.inputHandler = new funkin.ui.mainMenu.MenuInputHandler(this);
        this.selectionLogic = new funkin.ui.mainMenu.MainMenuSelection(this);

        this.menuItems = [];
        spriteData.items.forEach((data) => {
            this.menuItems.push(new funkin.ui.mainMenu.MenuOptionSprite(this, data));
        });
        
        this.camFollow = new Phaser.GameObjects.Zone(this, width / 2, this.menuItems[0].y, 1, 1);
        this.add.existing(this.camFollow);
        this.cameras.main.startFollow(this.camFollow, true, 0.08, 0.08);

        this.inputHandler.initControls();
        this.selectionLogic.updateSelection();

        if (!this.sys.game.device.os.desktop) this.setupMobileControls();
        
        this.cameras.main.fadeIn(250, 0, 0, 0, (cam, progress) => {
            if (progress === 1) this.canInteract = true;
        });

        this.engineVersionUI = new funkin.ui.mainMenu.MainMenuEngineVer(this);
    }

    update(time, delta) {
        if (funkin.controls) funkin.controls.update();
        if (this.bgManager) this.bgManager.update();
        if (this.canInteract && this.inputHandler) this.inputHandler.update();
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
        if (this.bgManager) this.bgManager.destroy();
        if (this.inputHandler) this.inputHandler.destroy();
        if (this.selectionLogic) this.selectionLogic.destroy();
        if (this.flickerTimer) this.flickerTimer.remove();

        this.input.off('pointerdown');
        this.input.off('pointermove');
        this.menuItems.forEach(item => item.off('pointerup'));
        
        this.canInteract = false;
    }
}

window.game.scene.add("MainMenuScene", MainMenuScene);