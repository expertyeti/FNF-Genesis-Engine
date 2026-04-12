/**
 * @file public/engine/src/funkin/play/visuals/arrows/strumelines/schedules/arrows.js
 * Schedule dedicado a sobreescribir el layout de los Strums para dispositivos móviles.
 */
window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.arrows = funkin.play.visuals.arrows || {};
funkin.play.visuals.arrows.strumlines = funkin.play.visuals.arrows.strumlines || {};
funkin.play.visuals.arrows.strumlines.schedules = funkin.play.visuals.arrows.strumlines.schedules || {};

class ArrowsSchedule {
    static applyMobile(layout, scene, keyCount) {
        if (!window.funkin.mobile || window.funkin.isKeyboardActive) return layout;

        const screenWidth = scene.cameras.main.width;
        const screenHeight = scene.cameras.main.height;
        const edgeMargin = screenWidth * 0.04;
        const keys = keyCount || 4;
        
        // Restaurada la constante original para evitar errores de cálculo por escalas encadenadas
        const BASE_SPACING = 118; 
        const mobileSpacing = BASE_SPACING * 1.5;
        const humanY = screenHeight - 150 - (screenHeight * 0.04);

        if (layout.playAsOpponent) {
            // Humano (Oponente) Centrado y Abajo
            layout.centerOpponent = screenWidth / 2;
            layout.oppY = humanY;
            layout.oppDownscroll = true;
            layout.oppSpacing = mobileSpacing;
            layout.gapOpp = 180;
            layout.showOppBg = layout.showBg !== undefined ? layout.showBg : true;

            // Bot (Jugador) Arriba a la derecha, pequeño
            layout.playerScale = layout.playerScale * 0.55;
            layout.playerSpacing = BASE_SPACING * 0.60; // Lógica estática restaurada
            layout.playerAlpha = 0.35;
            layout.showPlayerBg = false;
            
            const playerWidthHalf = (layout.playerSpacing * (keys - 1)) / 2;
            layout.centerPlayer = screenWidth - edgeMargin - playerWidthHalf;
            layout.playerY = 50;
            layout.playerDownscroll = false;
            layout.gapPlayer = 0;
            
        } else {
            // Humano (Jugador) Centrado y Abajo
            layout.centerPlayer = screenWidth / 2;
            layout.playerY = humanY;
            layout.playerDownscroll = true;
            layout.playerSpacing = mobileSpacing;
            layout.gapPlayer = 180;
            layout.showPlayerBg = layout.showBg !== undefined ? layout.showBg : true;

            // Bot (Oponente) Arriba a la izquierda, pequeño
            layout.oppScale = layout.oppScale * 0.55;
            layout.oppSpacing = BASE_SPACING * 0.60; // Lógica estática restaurada
            layout.oppAlpha = 0.35;
            layout.showOppBg = false;

            const oppWidthHalf = (layout.oppSpacing * (keys - 1)) / 2;
            layout.centerOpponent = edgeMargin + oppWidthHalf;
            layout.oppY = 50;
            layout.oppDownscroll = false;
            layout.gapOpp = 0;
        }

        layout.isMobile = true;
        return layout;
    }
}

funkin.play.visuals.arrows.strumlines.schedules.ArrowsSchedule = ArrowsSchedule;