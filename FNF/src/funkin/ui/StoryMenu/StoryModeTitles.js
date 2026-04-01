class StoryModeTitles {
    constructor(scene, dataManager) {
        this.scene = scene;
        this.dataManager = dataManager;
        this.titleSprites = [];

        // Variables para el parpadeo
        this.isFlashing = false;
        this.flashIndex = -1;
        this.flashTick = 0;
        this.flashFramerate = 24; // Parpadeos por segundo
        
        // Espaciado extra en píxeles (padding) entre los bordes de los títulos
        this.padding = 30; 

        this.createTitles();
    }

    createTitles() {
        const screenCenterX = this.scene.cameras.main.width / 2;
        const startY = 520; 

        this.dataManager.weeks.forEach((week, index) => {
            const sprite = this.scene.add.sprite(screenCenterX, startY, week.titleImage);
            
            // Garantizar que el origen esté en el centro para cálculos matemáticos precisos
            sprite.setOrigin(0.5, 0.5); 
            sprite.setDepth(1); 
            sprite.targetY = startY;
            sprite.alpha = 0.6;
            sprite.isCyan = false; 
            
            this.titleSprites.push(sprite);
        });

        // Aplicamos la posición matemática inicial
        this.updateSelection(this.dataManager.selectedWeekIndex);
        
        // Forzamos la posición sin transición la primera vez
        this.titleSprites.forEach(sprite => {
            sprite.y = sprite.targetY;
        });
    }

    updateSelection(currentIndex) {
        if (this.titleSprites.length === 0 || this.isFlashing) return;

        const startY = 520; 

        // 1. Posicionar el elemento seleccionado en el centro y actualizar Alphas
        this.titleSprites.forEach((item, index) => {
            if (index === currentIndex) {
                item.alpha = 1.0;
                item.targetY = startY; // El centro fijo
            } else {
                item.alpha = 0.6;
            }
        });

        // 2. Calcular posiciones exactas hacia abajo (basado en altura real)
        for (let i = currentIndex + 1; i < this.titleSprites.length; i++) {
            const prevItem = this.titleSprites[i - 1];
            const currentItem = this.titleSprites[i];
            
            // Distancia = (Mitad del Alto Anterior) + (Mitad del Alto Actual) + Padding extra
            const offset = (prevItem.displayHeight / 2) + (currentItem.displayHeight / 2) + this.padding;
            currentItem.targetY = prevItem.targetY + offset;
        }

        // 3. Calcular posiciones exactas hacia arriba (basado en altura real)
        for (let i = currentIndex - 1; i >= 0; i--) {
            const nextItem = this.titleSprites[i + 1];
            const currentItem = this.titleSprites[i];
            
            // Distancia = (Mitad del Alto Siguiente) + (Mitad del Alto Actual) + Padding extra
            const offset = (nextItem.displayHeight / 2) + (currentItem.displayHeight / 2) + this.padding;
            currentItem.targetY = nextItem.targetY - offset;
        }
    }

    // --- Inicia el efecto de parpadeo ---
    startFlashing(index) {
        this.isFlashing = true;
        this.flashIndex = index;
        this.flashTick = 0;
    }

    update(time, delta) {
        if (this.titleSprites.length === 0) return;

        // Movimiento suave normal
        const lerpFactor = Phaser.Math.Clamp(delta * 0.015, 0, 1);
        this.titleSprites.forEach(sprite => {
            sprite.y = Phaser.Math.Linear(sprite.y, sprite.targetY, lerpFactor);
        });

        // --- Lógica del parpadeo (Flicker) ---
        if (this.isFlashing && this.titleSprites[this.flashIndex]) {
            // Delta viene en ms, lo convertimos a segundos para la fórmula Haxe
            this.flashTick += (delta / 1000); 
            
            if (this.flashTick >= 1 / this.flashFramerate) {
                this.flashTick %= 1 / this.flashFramerate;
                
                const sprite = this.titleSprites[this.flashIndex];
                sprite.isCyan = !sprite.isCyan;
                
                // 0x33ffff es el Cyan, 0xffffff es Blanco/Normal
                sprite.setTint(sprite.isCyan ? 0x33ffff : 0xffffff); 
            }
        }
    }
}

window.StoryModeTitles = StoryModeTitles;