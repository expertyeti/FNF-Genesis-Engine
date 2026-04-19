/**
 * @file Schedules.js
 * Sobreescritura del layout para móviles acoplado al centro matemático global.
 */

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.arrows = funkin.play.visuals.arrows || {};
funkin.play.visuals.arrows.strumelines = funkin.play.visuals.arrows.strumelines || {};
funkin.play.visuals.arrows.strumelines.schedules = funkin.play.visuals.arrows.strumelines.schedules || {};

class ArrowsSchedule {
    static applyMobile(layout, scene, keyCount) {
        if (!window.funkin.mobile || window.funkin.isKeyboardActive) return layout;

        const screenWidth = scene.cameras.main.width;
        const screenHeight = scene.cameras.main.height;
        const edgeMargin = screenWidth * 0.04;
        const keys = keyCount || 4;
        
        const BASE_SPACING = 118; 
        const mobileSpacing = BASE_SPACING * 1.5;
        
        const ConfigClass = funkin.play.visuals.arrows.strumelines.StrumlineConfig;
        
        const bottomY = ConfigClass.calculateCenterY(screenHeight, true);
        const topY = ConfigClass.calculateCenterY(screenHeight, false);

        if (layout.playAsOpponent) {
            layout.centerOpponent = screenWidth / 2;
            layout.oppDownscroll = true; 
            layout.oppY = bottomY;
            layout.oppSpacing = mobileSpacing;
            layout.gapOpp = 180;
            layout.showOppBg = layout.showBg !== undefined ? layout.showBg : true;

            layout.playerScale = layout.playerScale * 0.55;
            layout.playerSpacing = BASE_SPACING * 0.60; 
            layout.playerAlpha = 0.35;
            layout.showPlayerBg = false;
            
            const playerWidthHalf = (layout.playerSpacing * (keys - 1)) / 2;
            layout.centerPlayer = screenWidth - edgeMargin - playerWidthHalf;
            layout.playerDownscroll = false;
            layout.playerY = topY;
            layout.gapPlayer = 0;
            
        } else {
            layout.centerPlayer = screenWidth / 2;
            layout.playerDownscroll = true; 
            layout.playerY = bottomY;
            layout.playerSpacing = mobileSpacing;
            layout.gapPlayer = 180;
            layout.showPlayerBg = layout.showBg !== undefined ? layout.showBg : true;

            layout.oppScale = layout.oppScale * 0.55;
            layout.oppSpacing = BASE_SPACING * 0.60; 
            layout.oppAlpha = 0.35;
            layout.showOppBg = false;

            const oppWidthHalf = (layout.oppSpacing * (keys - 1)) / 2;
            layout.centerOpponent = edgeMargin + oppWidthHalf;
            layout.oppDownscroll = false;
            layout.oppY = topY;
            layout.gapOpp = 0;
        }

        layout.isMobile = true;
        return layout;
    }
}
funkin.play.visuals.arrows.strumelines.schedules.ArrowsSchedule = ArrowsSchedule;