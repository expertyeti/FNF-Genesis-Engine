/**
 * @file MainMenuSelection.js
 * Lógica de selección y transiciones del menú. Incluye verificación de existencia de escenas.
 */
class MainMenuSelection {
    constructor(scene) {
        this.scene = scene;
        this.lastMoveTime = 0; 
        const bus = funkin.ui.mainMenu.eventBus;

        bus.removeAllListeners();
        bus.on('change_selection', this.changeSelection, this);
        bus.on('confirm_selection', this.confirmSelection, this);
        bus.on('go_back', this.goBack, this);
        bus.on('open_editor', this.openEditor, this);
    }

    changeSelection(change) {
        if (!this.scene.canInteract || this.scene.time.now < this.lastMoveTime) return;
        this.lastMoveTime = this.scene.time.now + 100;

        this.scene.selectSound.play();
        this.scene.selectedIndex = (this.scene.selectedIndex + change + this.scene.menuItems.length) % this.scene.menuItems.length;
        this.updateSelection();
    }

    handleTouch(index) {
        if (!this.scene.canInteract) return;
        if (this.scene.selectedIndex === index) {
            this.confirmSelection();
        } else {
            this.scene.selectSound.play();
            this.scene.selectedIndex = index;
            this.updateSelection();
        }
    }

    updateSelection() {
        this.scene.menuItems.forEach((item, index) => {
            const animType = (index === this.scene.selectedIndex) ? 'selected' : 'idle';
            const fullAnimKey = `${item.texture.key}_${animType}`;

            if (item.anims && (!item.anims.currentAnim || item.anims.currentAnim.key !== fullAnimKey)) {
                if (this.scene.anims.exists(fullAnimKey)) item.play(fullAnimKey);
            }
        });

        if (this.scene.menuItems[this.scene.selectedIndex] && this.scene.camFollow) {
            this.scene.camFollow.setPosition(this.scene.camFollow.x, this.scene.menuItems[this.scene.selectedIndex].y);
        }
    }

    confirmSelection() {
        if (!this.scene.canInteract) return;

        const selectedItem = this.scene.menuItems[this.scene.selectedIndex];
        
        // 1. Determinar cuál es la escena objetivo antes de hacer nada
        let targetScene = selectedItem.targetScene;
        
        if (!targetScene) {
            const key = selectedItem.texture.key.toLowerCase();
            if (key.includes("story")) targetScene = "StoryModeScene";
            else if (key.includes("freeplay")) targetScene = "FreePlayScene";
            else if (key.includes("options")) targetScene = "OptionsScene";
            else if (key.includes("credits")) targetScene = "CreditsScene";
            else targetScene = "PlayScene"; 
        }

        if (targetScene === "Editor") targetScene = "IDEScene";

        // 2. VERIFICACIÓN DE SEGURIDAD: ¿Existe la escena en el motor?
        // Comprobamos si la clave de la escena está registrada en el SceneManager global de Phaser
        if (!this.scene.scene.manager.keys.hasOwnProperty(targetScene)) {
            console.warn(`[Genesis Engine] Transición abortada: La escena '${targetScene}' no está registrada en el motor.`);
            
            // Feedback de error para el usuario
            this.scene.cancelSound.play(); 
            this.scene.cameras.main.shake(100, 0.01); // Pequeño temblor de cámara
            
            return; // Cortamos la ejecución aquí, no se bloquea la interacción
        }

        // 3. Si la escena existe, procedemos con la animación de transición
        this.scene.canInteract = false;
        this.scene.confirmSound.play();
        
        try { if (navigator.vibrate) navigator.vibrate([150, 50, 150]); } catch(e) {}

        let flickerCount = 0;
        this.scene.menuFlash.setVisible(true);

        this.scene.flickerTimer = this.scene.time.addEvent({
            delay: 90,
            callback: () => {
                this.scene.menuFlash.setVisible(!this.scene.menuFlash.visible);
                selectedItem.setVisible(!selectedItem.visible);
                if (++flickerCount >= 12) {
                    this.scene.menuFlash.setVisible(false);
                    selectedItem.setVisible(true);
                    this.scene.flickerTimer.remove();
                    this.scene.flickerTimer = null;
                }
            },
            loop: true
        });

        this.scene.menuItems.forEach((item, index) => {
            if (index !== this.scene.selectedIndex) {
                this.scene.tweens.add({ targets: item, alpha: 0, duration: 200, ease: 'Cubic.easeOut' });
            }
        });
        
        // Retraso para dejar que termine el parpadeo antes de llamar a TransitionScene
        this.scene.time.delayedCall(1100, () => this.playTransition(targetScene));
    }

    goBack() {
        if (!this.scene.canInteract) return;
        this.scene.canInteract = false;
        this.scene.cancelSound.play();
        this.playTransition("introDance");
    }

    openEditor() {
        if (!this.scene.canInteract) return;

        // Verificamos si el editor existe antes de entrar
        if (!this.scene.scene.manager.keys.hasOwnProperty("IDEScene")) {
            console.warn(`[Genesis Engine] Transición abortada: El Editor (IDEScene) no está registrado.`);
            this.scene.cancelSound.play();
            this.scene.cameras.main.shake(100, 0.01);
            return;
        }

        this.scene.canInteract = false;
        this.scene.confirmSound.play();
        this.playTransition("IDEScene");
    }

    playTransition(targetSceneName) {
        if (funkin.transition) funkin.transition(this.scene, targetSceneName);
        else this.scene.scene.start(targetSceneName);
    }

    destroy() {
        if (funkin.ui.mainMenu.eventBus) {
            funkin.ui.mainMenu.eventBus.removeAllListeners();
        }
    }
}

funkin.ui.mainMenu.MainMenuSelection = MainMenuSelection;