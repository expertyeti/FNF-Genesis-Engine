/**
 * @file StoryModeTracks.js
 * Muestra el nombre de las pistas incluidas en la semana seleccionada.
 */
class StoryModeTracks {
    constructor(scene, dataManager) {
        this.scene = scene;
        this.dataManager = dataManager;
        this.trackText = null;
        this.tracksImage = null;
        this.createUI();
    }

    createUI() {
        const width = this.scene.cameras.main.width;
        const posX = (width / 2) - (width * 0.33);
        const startY = 480; 

        this.tracksImage = this.scene.add.sprite(posX, startY, 'tracks_image');
        this.tracksImage.setOrigin(0.5, 0).setDepth(110); 

        this.trackText = this.scene.add.text(posX, startY + this.tracksImage.displayHeight + 15, '', {
            fontFamily: 'vcr, Arial, sans-serif',
            fontSize: '32px',
            color: '#E55777', 
            align: 'center'
        }).setOrigin(0.5, 0).setDepth(110);

        this.updateTracks();
    }

    updateTracks() {
        const currentWeek = this.dataManager.getCurrentWeek();
        
        if (!currentWeek || !currentWeek.data) {
            this.trackText.setText("NO TRACKS");
            return;
        }

        const tracksArray = this.extractTrackNames(currentWeek.data);
        // Quitamos el .toUpperCase() para respetar las mayúsculas y minúsculas originales
        this.trackText.setText(tracksArray.join('\n'));
    }

    extractTrackNames(weekData) {
        // Obtenemos los nombres resueltos desde el meta.json que generamos en StoryModeData
        if (weekData.resolvedTrackNames && weekData.resolvedTrackNames.length > 0) {
            return weekData.resolvedTrackNames;
        }

        // Fallback por si la metadata falló por algún motivo
        const tracksList = weekData.tracks || weekData.songs;
        if (!tracksList || !Array.isArray(tracksList) || tracksList.length === 0) return ["???"];
        if (typeof tracksList[0] === 'string') return tracksList;
        if (Array.isArray(tracksList[0])) return tracksList.map(songData => songData[0]);
        return ["???"];
    }
}

funkin.ui.storyMode.StoryModeTracks = StoryModeTracks;