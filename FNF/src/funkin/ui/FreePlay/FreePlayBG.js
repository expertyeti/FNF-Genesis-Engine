class FreePlayBG {
    static preload(scene) {
        if (!scene.textures.exists('menuDesat')) {
            scene.load.image('menuDesat', 'public/images/menu/bg/menuDesat.png');
        }
    }

    constructor(scene) {
        this.scene = scene;
        
        const screenWidth = this.scene.cameras.main.width;
        const screenHeight = this.scene.cameras.main.height;

        this.bg = this.scene.add.sprite(screenWidth / 2, screenHeight / 2, 'menuDesat');

        // Escala basada en el ancho de la escena para evitar bordes negros
        const scale = screenWidth / this.bg.width;
        this.bg.setScale(scale);
        this.bg.setDepth(0);

        // Color por defecto (El mismo amarillo del Story Mode)
        this.defaultColor = "#F9CF51";
        this.currentColorInt = Phaser.Display.Color.HexStringToColor(this.defaultColor).color;
        
        // Aplicamos el tinte inicial
        this.bg.setTint(this.currentColorInt);
        this.colorTween = null;
    }

    updateColor(targetHex) {
        // Si no existe, está vacío o no es un color Hexadecimal, usamos el por defecto
        let targetColor = targetHex;
        if (!targetColor || typeof targetColor !== 'string' || !targetColor.startsWith('#')) {
            targetColor = this.defaultColor;
        }

        const targetColorInt = Phaser.Display.Color.HexStringToColor(targetColor).color;

        // Si ya es de ese color, no hacemos nada
        if (this.currentColorInt === targetColorInt) return;

        // Detenemos el tween anterior si el jugador scrollea muy rápido
        if (this.colorTween) {
            this.colorTween.stop();
        }

        const startColorObj = Phaser.Display.Color.IntegerToColor(this.currentColorInt);
        const endColorObj = Phaser.Display.Color.HexStringToColor(targetColor);

        // Transición de color fluida idéntica a la del Story Mode
        this.colorTween = this.scene.tweens.addCounter({
            from: 0,
            to: 100,
            duration: 900, // Duración suave
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
}

// Exportamos de forma global
if (typeof window !== 'undefined') {
    window.FreePlayBG = FreePlayBG;
}