/**
 * @file MenuInputHandler.js
 * Gestiona el input de teclado y scroll del menú principal.
 */
class MenuInputHandler {
    constructor(scene) {
        this.scene = scene;
        this.wheelTimer = 0; 
    }

    initControls() {
        this.onWheel = (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            if (this.scene.time.now < this.wheelTimer) return;
            this.wheelTimer = this.scene.time.now + 10; 

            if (deltaY > 0) funkin.ui.mainMenu.eventBus.emit('change_selection', 1);
            else if (deltaY < 0) funkin.ui.mainMenu.eventBus.emit('change_selection', -1);
        };
        this.scene.input.on('wheel', this.onWheel);
    }

    update() {
        if (!this.scene.canInteract) return;

        if (funkin.controls.UI_UP_P) funkin.ui.mainMenu.eventBus.emit('change_selection', -1);
        if (funkin.controls.UI_DOWN_P) funkin.ui.mainMenu.eventBus.emit('change_selection', 1);
        if (funkin.controls.ACCEPT_P) funkin.ui.mainMenu.eventBus.emit('confirm_selection');
        if (funkin.controls.BACK_P) funkin.ui.mainMenu.eventBus.emit('go_back');
        if (funkin.controls.DEBUGG_P) funkin.ui.mainMenu.eventBus.emit('open_editor');
    }

    destroy() {
        this.scene.input.off('wheel', this.onWheel);
    }
}

funkin.ui.mainMenu.MenuInputHandler = MenuInputHandler;