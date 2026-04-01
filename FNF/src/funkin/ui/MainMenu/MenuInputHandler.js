class MenuInputHandler {
    constructor(scene) {
        this.scene = scene;
        this.wheelTimer = 0; 
    }

    initControls() {
        this.onWheel = (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            if (this.scene.time.now < this.wheelTimer) return;
            this.wheelTimer = this.scene.time.now + 10; 

            if (deltaY > 0) window.mainMenuEventBus.emit('change_selection', 1);
            else if (deltaY < 0) window.mainMenuEventBus.emit('change_selection', -1);
        };
        this.scene.input.on('wheel', this.onWheel);
    }

    update() {
        if (!this.scene.canInteract) return;

        if (funkin.controls.UI_UP_P) window.mainMenuEventBus.emit('change_selection', -1);
        if (funkin.controls.UI_DOWN_P) window.mainMenuEventBus.emit('change_selection', 1);
        if (funkin.controls.ACCEPT_P) window.mainMenuEventBus.emit('confirm_selection');
        if (funkin.controls.BACK_P) window.mainMenuEventBus.emit('go_back');

        // CORRECCIÓN: Detectamos la tecla de Debug (7) limpiamente con nuestro sistema de controles
        // Esto previene los bloqueos de doble llamada en la escena de transición
        if (funkin.controls.DEBUGG_P) {
            window.mainMenuEventBus.emit('open_editor');
        }
    }

    destroy() {
        this.scene.input.off('wheel', this.onWheel);
    }
}

window.MenuInputHandler = MenuInputHandler;