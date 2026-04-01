/**
 * @file src/funkin/play/visuals/arrows/notes/noteDirection.js
 * API Global para gestionar las direcciones de las notas.
 * Preparado para escalar a múltiples teclas (Multikey: 6K, 9K, etc.) en el futuro.
 */

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
        // Mapas de nombres base por cantidad de teclas (expandible para el futuro)
        const mappings = {
            1: ['center'],
            2: ['left', 'right'],
            3: ['left', 'center', 'right'],
            4: ['left', 'down', 'up', 'right'], // Estándar FNF
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
        // Lógica estándar FNF: Par = Oponente, Impar = Jugador (0, 1)
        return p % 2 !== 0; 
    }

    initAPI() {
        const self = this;
        // Recreamos la estructura global para que los demás scripts sigan funcionando sin cambios
        funkin.NoteDirection = {
            get keyCount() { return self.keyCount; },
            getDirectionName: (dir) => self.getDirectionName(dir),
            getColorName: (dir) => self.getColorName(dir),
            getBaseLane: (dir) => self.getBaseLane(dir),
            isPlayerNote: (p) => self.isPlayerNote(p),
            setKeyCount: (keys) => self.setKeyCount(keys),
            getMappings: () => ({ names: self.directionNames, colors: self.colorNames })
        };
    }

    destroy() {
        // Limpieza global para evitar memory leaks al cambiar de escena
        funkin.NoteDirection = null;
    }
}

if (typeof window !== 'undefined') {
    funkin.NoteDirectionManager = NoteDirectionManager;
}