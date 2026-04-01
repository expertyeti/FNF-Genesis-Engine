class MainMenuSelection {
    constructor(scene) {
        this.scene = scene;
        this.lastMoveTime = 0; 

        if (window.mainMenuEventBus) {
            window.mainMenuEventBus.removeAllListeners();
        }

        window.mainMenuEventBus.on('change_selection', this.changeSelection, this);
        window.mainMenuEventBus.on('confirm_selection', this.confirmSelection, this);
        window.mainMenuEventBus.on('go_back', this.goBack, this);
        window.mainMenuEventBus.on('open_editor', this.openEditor, this);
    }

    changeSelection(change) {
        if (!this.scene.canInteract) return;

        if (this.scene.time.now < this.lastMoveTime) return;
        this.lastMoveTime = this.scene.time.now + 100;

        this.scene.selectSound.play();
        this.scene.selectedIndex += change;

        if (this.scene.selectedIndex < 0) {
            this.scene.selectedIndex = this.scene.menuItems.length - 1;
        } else if (this.scene.selectedIndex >= this.scene.menuItems.length) {
            this.scene.selectedIndex = 0;
        }

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
            const baseKey = item.texture.key; 
            const animType = (index === this.scene.selectedIndex) ? 'selected' : 'idle';
            const fullAnimKey = `${baseKey}_${animType}`;

            if (item.anims && (!item.anims.currentAnim || item.anims.currentAnim.key !== fullAnimKey)) {
                if (this.scene.anims.exists(fullAnimKey)) item.play(fullAnimKey);
            }
        });

        if (this.scene.menuItems[this.scene.selectedIndex] && this.scene.camFollow) {
            const targetY = this.scene.menuItems[this.scene.selectedIndex].y;
            this.scene.camFollow.setPosition(this.scene.camFollow.x, targetY);
        }
    }

    confirmSelection() {
        if (!this.scene.canInteract) return;

        this.scene.canInteract = false;
        this.scene.confirmSound.play();
        
        if (navigator.vibrate) navigator.vibrate([150, 50, 150]);

        const selectedItem = this.scene.menuItems[this.scene.selectedIndex];
        const duration = 1100, interval = 90;
        const totalFlickers = Math.floor(duration / interval);
        let flickerCount = 0;

        this.scene.menuFlash.setVisible(true);

        this.scene.flickerTimer = this.scene.time.addEvent({
            delay: interval,
            callback: () => {
                this.scene.menuFlash.setVisible(!this.scene.menuFlash.visible);
                selectedItem.setVisible(!selectedItem.visible);
                flickerCount++;
                if (flickerCount >= totalFlickers) {
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

        let targetScene = selectedItem.targetScene;

        // SALVAVIDAS: Si el JSON no tiene targetScene explícito, deduce la escena por el nombre del gráfico
        if (!targetScene) {
            const key = selectedItem.texture.key.toLowerCase();
            if (key.includes("story")) targetScene = "StoryModeScene";
            else if (key.includes("freeplay")) targetScene = "FreePlayScene";
            else if (key.includes("options")) targetScene = "OptionsScene";
            else if (key.includes("credits")) targetScene = "CreditsScene";
            else targetScene = "PlayScene"; // Fallback de emergencia
        }

        if (targetScene === "Editor") targetScene = "IDEScene";
        
        this.scene.time.delayedCall(1100, () => {
            this.playTransition(targetScene);
        });
    }

    goBack() {
        if (!this.scene.canInteract) return;
        this.scene.canInteract = false;
        this.scene.cancelSound.play();

        this.playTransition("introDance");
    }

    openEditor() {
        if (!this.scene.canInteract) return;
        this.scene.canInteract = false;
        this.scene.confirmSound.play();
        
        this.playTransition("IDEScene");
    }

    playTransition(targetSceneName) {
        // Uso simple y directo de la API
        if (typeof funkin !== 'undefined' && funkin.transition) {
            funkin.transition(this.scene, targetSceneName);
        } else {
            this.scene.scene.start(targetSceneName);
        }
    }

    destroy() {
        if (window.mainMenuEventBus) {
            window.mainMenuEventBus.removeAllListeners();
        }
    }
}

window.MainMenuSelection = MainMenuSelection;