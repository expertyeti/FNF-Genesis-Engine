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
        
        // Posición X: Centro de la pantalla menos el 33% del ancho total
        const posX = (width / 2) - (width * 0.33);
        
        // Posición Y: Debajo del fondo amarillo (56 + 400 + pequeño margen)
        const startY = 480; 

        // 1. Imagen de "TRACKS"
        this.tracksImage = this.scene.add.sprite(posX, startY, 'tracks_image');
        this.tracksImage.setOrigin(0.5, 0); // Anclado arriba al centro
        this.tracksImage.setDepth(110); // Misma profundidad que los títulos para que se vea

        // 2. Texto de las canciones
        this.trackText = this.scene.add.text(posX, startY + this.tracksImage.displayHeight + 15, '', {
            fontFamily: 'vcr, Arial, sans-serif',
            fontSize: '32px',
            color: '#E55777', // Color rosa clásico 0xFFE55777
            align: 'center'
        });
        this.trackText.setOrigin(0.5, 0); // Anclado arriba al centro para que crezca hacia abajo
        this.trackText.setDepth(110);

        // Inicializar con la primera semana
        this.updateTracks();
    }

    updateTracks() {
        const currentWeek = this.dataManager.getCurrentWeek();
        
        if (!currentWeek || !currentWeek.data) {
            this.trackText.setText("NO TRACKS");
            return;
        }

        const tracksArray = this.extractTrackNames(currentWeek.data);
        
        // Unimos los nombres con saltos de línea y los ponemos en mayúsculas
        const tracksString = tracksArray.join('\n').toUpperCase();
        
        this.trackText.setText(tracksString);
    }

    // Extrae correctamente los nombres sin importar si es un Array simple o anidado
    extractTrackNames(weekData) {
        const tracksList = weekData.tracks || weekData.songs;
        if (!tracksList || !Array.isArray(tracksList) || tracksList.length === 0) {
            return ["???"];
        }

        // Si es un arreglo simple ["Test", "Bopeebo"]
        if (typeof tracksList[0] === 'string') {
            return tracksList;
        } 
        // Si es un arreglo anidado al estilo Psych Engine [["Bopeebo", "dad", [1,1,1]]]
        else if (Array.isArray(tracksList[0])) {
            return tracksList.map(songData => songData[0]);
        }

        return ["???"];
    }
}

window.StoryModeTracks = StoryModeTracks;