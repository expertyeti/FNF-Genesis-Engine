/**
 * @file FreePlayBG.js
 * Fondo dinámico para el menú FreePlay que realiza transiciones suaves de color
 * basándose en la semana de la canción seleccionada.
 */
class FreePlayBG {
    static preload(scene) {
        if (!scene.textures.exists('menuDesat')) {
            scene.load.image('menuDesat', window.BASE_URL + 'assets/images/menu/bg/menuDesat.png');
        }
    }

    constructor(scene) {
        this.scene = scene;
        
        const screenWidth = this.scene.cameras.main.width;
        const screenHeight = this.scene.cameras.main.height;

        this.bg = this.scene.add.sprite(screenWidth / 2, screenHeight / 2, 'menuDesat');

        const scale = screenWidth / this.bg.width;
        this.bg.setScale(scale).setDepth(0);

        this.defaultColor = "#F9CF51";
        this.currentColorInt = Phaser.Display.Color.HexStringToColor(this.defaultColor).color;
        
        this.bg.setTint(this.currentColorInt);
        this.colorTween = null;
    }

    updateColor(targetHex) {
        let targetColor = targetHex;
        if (!targetColor || typeof targetColor !== 'string' || !targetColor.startsWith('#')) {
            targetColor = this.defaultColor;
        }

        const targetColorInt = Phaser.Display.Color.HexStringToColor(targetColor).color;

        if (this.currentColorInt === targetColorInt) return;

        if (this.colorTween) this.colorTween.stop();

        const startColorObj = Phaser.Display.Color.IntegerToColor(this.currentColorInt);
        const endColorObj = Phaser.Display.Color.HexStringToColor(targetColor);

        this.colorTween = this.scene.tweens.addCounter({
            from: 0,
            to: 100,
            duration: 900, 
            ease: 'Quart.easeOut',
            onUpdate: (tween) => {
                const value = tween.getValue();
                const colorInterpolated = Phaser.Display.Color.Interpolate.ColorWithColor(
                    startColorObj, endColorObj, 100, value
                );
                this.currentColorInt = Phaser.Display.Color.GetColor(
                    colorInterpolated.r, colorInterpolated.g, colorInterpolated.b
                );
                this.bg.setTint(this.currentColorInt);
            }
        });
    }
    
    destroy() {
        if (this.colorTween) this.colorTween.stop();
        if (this.bg) this.bg.destroy();
    }
}

funkin.ui.freeplay.FreePlayBG = FreePlayBG;