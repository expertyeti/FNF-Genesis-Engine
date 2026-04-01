class StoryModeProps {
    constructor(scene) {
        this.scene = scene;
        this.currentBg = null;
        this.colorTween = null;
    }

    buildBackground(initialWeekData) {
        const width = this.scene.cameras.main.width;

        const topBlackBar = this.scene.add.rectangle(0, 0, width, 56, 0x000000);
        topBlackBar.setOrigin(0, 0);
        topBlackBar.setDepth(99); 

        // Crea el fondo inicial (sea color o imagen)
        this.currentBg = this.createBgObject(initialWeekData);
        this.currentBg.setAlpha(1.0); 

        return this.currentBg;
    }

    createBgObject(weekData) {
        const width = this.scene.cameras.main.width;
        const height = 400; 

        let bgVal = "#F9CF51"; 
        if (weekData && weekData.data && weekData.data.weekBackground && weekData.data.weekBackground.trim() !== "") {
            bgVal = weekData.data.weekBackground.trim();
        }

        let bgObj;

        // Si empieza con "#", es un color
        if (bgVal.startsWith("#")) {
            const colorInt = Phaser.Display.Color.HexStringToColor(bgVal).color;
            bgObj = this.scene.add.rectangle(0, 56, width, height, colorInt);
        } else {
            // Si es un string normal, intentamos cargarlo como sprite
            if (this.scene.textures.exists(bgVal)) {
                bgObj = this.scene.add.sprite(0, 56, bgVal);
            } else {
                // Fallback: Si no existe la imagen, ponemos el amarillo por defecto
                const defaultColor = Phaser.Display.Color.HexStringToColor("#F9CF51").color;
                bgObj = this.scene.add.rectangle(0, 56, width, height, defaultColor);
                bgVal = "#F9CF51"; // Corregimos el valor interno para la lógica de transición
            }
        }

        bgObj.setOrigin(0, 0);
        bgObj.setDepth(100); 
        bgObj.bgValue = bgVal; // Guardamos la propiedad para comparaciones futuras

        return bgObj;
    }

    updateBackground(weekData) {
        if (!this.currentBg) return;

        let targetVal = "#F9CF51";
        if (weekData && weekData.data && weekData.data.weekBackground && weekData.data.weekBackground.trim() !== "") {
            targetVal = weekData.data.weekBackground.trim();
        }

        // Si el valor es exactamente el mismo, ignorar
        if (this.currentBg.bgValue === targetVal) return;

        if (this.colorTween) {
            this.colorTween.stop();
        }

        const isCurrentSimple = this.currentBg.bgValue.startsWith("#");
        const isTargetSimple = targetVal.startsWith("#");

        // SI AMBOS SON COLORES SIMPLES -> Interpolación Directa
        if (isCurrentSimple && isTargetSimple) {
            const startColorObj = Phaser.Display.Color.IntegerToColor(this.currentBg.fillColor);
            const endColorObj = Phaser.Display.Color.HexStringToColor(targetVal);

            this.currentBg.bgValue = targetVal; 

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
                    const colorInt = Phaser.Display.Color.GetColor(
                        colorInterpolated.r, colorInterpolated.g, colorInterpolated.b
                    );
                    this.currentBg.setFillStyle(colorInt);
                }
            });
        } 
        // SI UNO O AMBOS SON IMÁGENES -> Crossfade (Se oculta el viejo, aparece el nuevo)
        else {
            const oldBg = this.currentBg;
            
            // Construir el nuevo fondo oculto (alpha 0)
            const newBg = this.createBgObject(weekData);
            newBg.setAlpha(0.0);
            this.currentBg = newBg; // Transferir control

            // Fade out al fondo viejo
            this.scene.tweens.add({
                targets: oldBg,
                alpha: 0.0,
                duration: 600, // 0.6s
                ease: 'Linear',
                onComplete: () => {
                    oldBg.destroy();
                }
            });

            // Fade in al fondo nuevo
            this.scene.tweens.add({
                targets: newBg,
                alpha: 1.0,
                duration: 600, // 0.6s
                ease: 'Linear'
            });
        }
    }
}

window.StoryModeProps = StoryModeProps;