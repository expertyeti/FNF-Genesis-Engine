/**
 * @file public/engine/src/funkin/play/visuals/arrows/strumelines/middlescroll/DefaultMode.js
 */
window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.arrows = funkin.play.visuals.arrows || {};
funkin.play.visuals.arrows.strumlines = funkin.play.visuals.arrows.strumlines || {};
funkin.play.visuals.arrows.strumlines.middlescroll = funkin.play.visuals.arrows.strumlines.middlescroll || {};

class DefaultMode {
    static calculate(ctx) {
        return {
            oppY: ctx.DEFAULT_Y, 
            playerY: ctx.DEFAULT_Y, 
            centerOpponent: ctx.screenWidth * 0.25, 
            centerPlayer: ctx.screenWidth * 0.75, 
            oppScale: ctx.skinScale, 
            playerScale: ctx.skinScale, 
            oppAlpha: 1.0, 
            playerAlpha: 1.0, 
            oppSpacing: ctx.BASE_SPACING, 
            playerSpacing: ctx.BASE_SPACING, 
            showOppBg: ctx.showBg, 
            showPlayerBg: ctx.showBg, 
            gapPlayer: 0, 
            gapOpp: 0, 
            oppDownscroll: ctx.isDownscroll, 
            playerDownscroll: ctx.isDownscroll, 
            playAsOpponent: ctx.playAsOpponent, 
            bgOpacity: ctx.bgOpacity
        };
    }
}

funkin.play.visuals.arrows.strumlines.middlescroll.DefaultMode = DefaultMode;