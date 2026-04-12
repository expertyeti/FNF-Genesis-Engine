/**
 * @file StoryModeDiff.js
 * Seleccionador visual de la dificultad (Flechas y Sprite).
 */
class StoryModeDifficulty {
    constructor(scene, dataManager) {
        this.scene = scene;
        this.dataManager = dataManager;
        this.yPos = 525;
        this.createUI();
    }

    createUI() {
        const width = this.scene.cameras.main.width;
        const leftX = width - 390; 
        const rightX = width - 30; 
        const centerX = (leftX + rightX) / 2; 

        if (!this.scene.anims.exists('leftIdle')) {
            this.scene.anims.create({ key: 'leftIdle', frames: [{ key: 'storymode_arrows', frame: 'leftIdle0000' }], frameRate: 24 });
            this.scene.anims.create({ key: 'leftConfirm', frames: [{ key: 'storymode_arrows', frame: 'leftConfirm0000' }], frameRate: 24 });
            this.scene.anims.create({ key: 'rightIdle', frames: [{ key: 'storymode_arrows', frame: 'rightIdle0000' }], frameRate: 24 });
            this.scene.anims.create({ key: 'rightConfirm', frames: [{ key: 'storymode_arrows', frame: 'rightConfirm0000' }], frameRate: 24 });
        }

        this.leftArrow = this.scene.add.sprite(leftX, this.yPos, 'storymode_arrows').play('leftIdle').setDepth(110).setOrigin(0.5, 0.5);
        this.leftArrow.name = 'leftArrowDiff';

        this.rightArrow = this.scene.add.sprite(rightX, this.yPos, 'storymode_arrows').play('rightIdle').setDepth(110).setOrigin(0.5, 0.5);
        this.rightArrow.name = 'rightArrowDiff';

        if (!this.scene.sys.game.device.os.desktop) {
            this.leftArrow.setInteractive();
            this.rightArrow.setInteractive();
        }

        const diffName = this.dataManager.getCurrentDifficultyName();
        this.difficultySprite = this.scene.add.sprite(centerX, this.yPos, `difficulty_${diffName}`).setDepth(110).setOrigin(0.5, 0.5);

        this.updateDifficultySprite();
    }

    changeDifficulty(direction) {
        this.dataManager.changeDifficulty(direction);
        this.updateDifficultySprite();
    }

    updateDifficultySprite() {
        if (!this.difficultySprite) return;

        const diffName = this.dataManager.getCurrentDifficultyName();
        this.difficultySprite.setTexture(`difficulty_${diffName}`);
        this.difficultySprite.alpha = 0;
        this.difficultySprite.y = this.yPos - 15;

        if (this.difficultyTween) this.difficultyTween.stop();

        this.difficultyTween = this.scene.tweens.add({
            targets: this.difficultySprite,
            y: this.yPos, alpha: 1, duration: 70, ease: 'Linear'
        });
    }

    update() {
        if (!this.leftArrow || !this.leftArrow.active) return;

        if (funkin.controls) {
            if (funkin.controls.UI_LEFT) this.leftArrow.play('leftConfirm', true);
            else this.leftArrow.play('leftIdle', true);

            if (funkin.controls.UI_RIGHT) this.rightArrow.play('rightConfirm', true);
            else this.rightArrow.play('rightIdle', true);
        }
    }
}

funkin.ui.storyMode.StoryModeDifficulty = StoryModeDifficulty;