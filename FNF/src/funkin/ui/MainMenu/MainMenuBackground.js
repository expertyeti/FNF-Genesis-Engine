/**
 * @file src/funkin/ui/MainMenu/MainMenuBackground.js
 * Maneja el fondo del menú principal, incluyendo cálculos de escala seguros
 * y efecto parallax con giroscopio en dispositivos móviles.
 */

class MainMenuBackground {
    constructor(scene, spriteData) {
        this.scene = scene;
        const { width, height } = scene.scale;

        const bgData = spriteData.bg;
        const flashData = spriteData.flash;

        // Márgenes extra de movimiento para el giroscopio
        this.gyroPaddingX = 60;
        this.gyroPaddingY = 60;
        
        // Variables para interpolación fluida (lerp)
        this.targetGyroOffsetX = 0;
        this.targetGyroOffsetY = 0;
        this.currentGyroOffsetX = 0;
        this.currentGyroOffsetY = 0;

        // 1. Calcular límites de los items para saber cuánto bajará/subirá la cámara
        let minItemY = height / 2;
        let maxItemY = height / 2;

        if (spriteData.items && spriteData.items.length > 0) {
            minItemY = Math.min(...spriteData.items.map(item => item.y));
            maxItemY = Math.max(...spriteData.items.map(item => item.y));
        }

        let scrollFactorY = bgData.scrollFactor;
        if (Array.isArray(bgData.scrollFactor)) scrollFactorY = bgData.scrollFactor[1] ?? bgData.scrollFactor[0];
        else if (bgData.scrollFactor && typeof bgData.scrollFactor === 'object') scrollFactorY = bgData.scrollFactor.y ?? bgData.scrollFactor.x;
        if (typeof scrollFactorY !== 'number') scrollFactorY = 0.18; 

        // 2. Cálculo exacto del tamaño requerido para NUNCA mostrar negro
        const maxScrollDeviation = Math.max(
            Math.abs(minItemY - height / 2),
            Math.abs(maxItemY - height / 2)
        );

        // Alto necesario = Pantalla + movimiento por selección + movimiento de giroscopio
        const parallaxPaddingY = maxScrollDeviation * scrollFactorY;
        const requiredHeight = height + (parallaxPaddingY * 2) + (this.gyroPaddingY * 2);
        
        // Ancho necesario = Pantalla + movimiento de giroscopio
        const requiredWidth = width + (this.gyroPaddingX * 2);

        this.baseX = width / 2;
        this.baseY = height / 2;

        // 3. Crear el fondo
        this.bg = scene.add.sprite(this.baseX, this.baseY, 'menuBackground');

        // Determinar escala que cubra tanto el ancho como el alto necesarios
        const scaleX = requiredWidth / this.bg.width;
        const scaleY = requiredHeight / this.bg.height;
        const bgZoomScale = Math.max(scaleX, scaleY);

        this.bg.setScale(bgZoomScale).setScrollFactor(bgData.scrollFactor).setDepth(bgData.depth);

        // 4. Crear el Flash Magenta
        this.flashSprite = scene.add.sprite(this.baseX, this.baseY, 'menuFlash');
        this.flashSprite.setScale(bgZoomScale).setScrollFactor(flashData.scrollFactor).setDepth(flashData.depth);
        this.flashSprite.setVisible(false).setAlpha(1);

        // 5. Configurar sensores en móviles
        this.handleOrientation = this.handleOrientation.bind(this);
        if (!scene.sys.game.device.os.desktop && window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', this.handleOrientation);
            
            // Permiso requerido para iOS 13+ (Se activará tras el primer toque)
            scene.input.once('pointerdown', () => {
                if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                    DeviceOrientationEvent.requestPermission().catch(console.error);
                }
            });
        }
    }

    handleOrientation(event) {
        // En horizontal (landscape), beta y gamma representan la inclinación
        let gamma = event.gamma || 0;
        let beta = event.beta || 0;

        let xTilt = 0;
        let yTilt = 0;
        
        // Ajustar lectura dependiendo de cómo sostengan el celular
        const orientation = (screen.orientation || {}).angle || window.orientation || 0;
        
        if (orientation === 90 || orientation === -270) { 
            xTilt = beta; 
            yTilt = -gamma;
        } else if (orientation === -90 || orientation === 270) { 
            xTilt = -beta;
            yTilt = gamma;
        } else {
            xTilt = gamma;
            yTilt = beta;
        }

        // Limitar inclinación física para que no se pase del límite calculado
        xTilt = Phaser.Math.Clamp(xTilt, -35, 35);
        yTilt = Phaser.Math.Clamp(yTilt, -35, 35);

        // Mapear el ángulo de rotación a los píxeles permitidos de offset
        this.targetGyroOffsetX = (xTilt / 35) * this.gyroPaddingX;
        this.targetGyroOffsetY = (yTilt / 35) * this.gyroPaddingY;
    }

    update() {
        // Interpolar (lerp) para que el movimiento sea ultra suave y no robótico
        this.currentGyroOffsetX += (this.targetGyroOffsetX - this.currentGyroOffsetX) * 0.08;
        this.currentGyroOffsetY += (this.targetGyroOffsetY - this.currentGyroOffsetY) * 0.08;

        this.bg.x = this.baseX + this.currentGyroOffsetX;
        this.bg.y = this.baseY + this.currentGyroOffsetY;

        this.flashSprite.x = this.bg.x;
        this.flashSprite.y = this.bg.y;
    }

    destroy() {
        window.removeEventListener('deviceorientation', this.handleOrientation);
    }
}

window.MainMenuBackground = MainMenuBackground;