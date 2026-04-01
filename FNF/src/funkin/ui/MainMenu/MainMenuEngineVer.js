class MainMenuEngineVer {
    constructor(scene) {
        this.scene = scene;
        this.createUI();
    }

    createUI() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        this.uiCamera = this.scene.cameras.add(0, 0, width, height);
        this.uiCamera.setBackgroundColor('rgba(0,0,0,0)'); 
        
        const title = this.scene.game.config.gameTitle || "Genesis Engine";
        const version = this.scene.game.config.gameVersion || "1.0";
        const commit = this.scene.game.config.commit || window.GAME_COMMIT;

        let textString = `${title}: ${version}`;
        if (commit) {
            textString += ` (${commit})`;
        }

        this.versionText = this.scene.add.text(5, height - 5, textString, {
            fontFamily: 'vcr, Arial, sans-serif',
            fontSize: '23px',
            color: '#ffffff',
            align: 'left',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0, 1);

        this.scene.cameras.main.ignore(this.versionText);
        
        const elementsToIgnore = this.scene.children.list.filter(child => child !== this.versionText);
        this.uiCamera.ignore(elementsToIgnore);

        this.uiCamera.fadeIn(250, 0, 0, 0);
    }
}

window.MainMenuEngineVer = MainMenuEngineVer;