class RialNotes {
    static getXPosition(lane, isPlayer, strumlinesInstance) {
        if (!strumlinesInstance) return 0;
        const strumArray = isPlayer ? strumlinesInstance.playerStrums : strumlinesInstance.opponentStrums;
        if (strumArray && strumArray[lane]) return strumArray[lane].baseX; 
        return 0;
    }
    static getYPosition(lane, isPlayer, strumlinesInstance) {
        if (!strumlinesInstance) return 50; 
        const strumArray = isPlayer ? strumlinesInstance.playerStrums : strumlinesInstance.opponentStrums;
        if (strumArray && strumArray[lane]) return strumArray[lane].baseY;
        return 50;
    }
}
funkin.play.visuals.arrows.notes.RialNotes = RialNotes;