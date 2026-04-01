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
        return p % 2 !== 0; // p impar = player, par = oponente
    }
}
if (typeof window !== 'undefined') funkin.NoteDirection = NoteDirection;