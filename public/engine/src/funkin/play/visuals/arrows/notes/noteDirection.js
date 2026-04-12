class NoteDirection {
    static getDirectionName(dir) {
        const map = ['left', 'down', 'up', 'right'];
        return map[dir % 4];
    }
    static getColorName(dir) {
        const map = ['purple', 'blue', 'green', 'red'];
        return map[dir % 4];
    }
    static getBaseLane(dir) {
        return dir % 4; 
    }
    static isPlayerNote(p) {
        // FIX: Entiende si es un string (nueva estructura "pl") o número (vieja estructura)
        if (typeof p === "string") {
            const pStr = p.toLowerCase();
            return pStr === "pl" || pStr === "player";
        }
        return p % 2 !== 0;
    }
}
funkin.play.visuals.arrows.notes.NoteDirection = NoteDirection;