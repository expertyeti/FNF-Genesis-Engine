/**
 * @file noteDirections.js
 * Módulo para gestionar dinámicamente las direcciones según la cantidad de teclas (keyCount).
 */

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.arrows = funkin.play.visuals.arrows || {};
funkin.play.visuals.arrows.notes = funkin.play.visuals.arrows.notes || {};

class NoteDirectionManager {
    constructor(keyCount = 4) {
        this.setKeyCount(keyCount);
        this.initAPI();
    }

    setKeyCount(keys) {
        this.keyCount = keys;
        this.updateMappings();
    }

    updateMappings() {
        const mappings = {
            1: ['center'],
            2: ['left', 'right'],
            3: ['left', 'center', 'right'],
            4: ['left', 'down', 'up', 'right'],
            5: ['left', 'down', 'center', 'up', 'right'],
            6: ['left', 'up', 'right', 'left', 'down', 'right'],
            7: ['left', 'up', 'right', 'center', 'left', 'down', 'right'],
            8: ['left', 'down', 'up', 'right', 'left', 'down', 'up', 'right'],
            9: ['left', 'down', 'up', 'right', 'center', 'left', 'down', 'up', 'right']
        };

        const colorMappings = {
            4: ['purple', 'blue', 'green', 'red']
        };

        this.directionNames = mappings[this.keyCount] || mappings[4];
        this.colorNames = colorMappings[this.keyCount] || colorMappings[4];
    }

    getDirectionName(dir) {
        const index = dir % this.keyCount;
        return this.directionNames[index] || 'unknown';
    }

    getColorName(dir) {
        const index = dir % this.keyCount;
        return this.colorNames[index] || 'unknown';
    }

    getBaseLane(dir) {
        return dir % this.keyCount;
    }

    isPlayerNote(p) {
        return p % 2 !== 0; 
    }

    initAPI() {
        const self = this;
        // Registro dual: global y en el namespace anidado para consistencia del motor
        window.funkin.NoteDirection = {
            get keyCount() { return self.keyCount; },
            getDirectionName: (dir) => self.getDirectionName(dir),
            getColorName: (dir) => self.getColorName(dir),
            getBaseLane: (dir) => self.getBaseLane(dir),
            isPlayerNote: (p) => self.isPlayerNote(p),
            setKeyCount: (keys) => self.setKeyCount(keys),
            getMappings: () => ({ names: self.directionNames, colors: self.colorNames })
        };
        
        // Alias de seguridad
        funkin.play.visuals.arrows.notes.NoteDirection = window.funkin.NoteDirection;
    }

    destroy() {
        window.funkin.NoteDirection = null;
        if (funkin.play.visuals.arrows.notes) {
            funkin.play.visuals.arrows.notes.NoteDirection = null;
        }
    }
}

funkin.play.visuals.arrows.notes.NoteDirectionManager = NoteDirectionManager;