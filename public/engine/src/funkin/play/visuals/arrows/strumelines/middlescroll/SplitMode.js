/**
 * @file public/engine/src/funkin/play/visuals/arrows/strumelines/middlescroll/SplitMode.js
 */
window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.arrows = funkin.play.visuals.arrows || {};
funkin.play.visuals.arrows.strumlines = funkin.play.visuals.arrows.strumlines || {};
funkin.play.visuals.arrows.strumlines.middlescroll = funkin.play.visuals.arrows.strumlines.middlescroll || {};

class SplitMode {
    static calculate(ctx) {
        const layout = funkin.play.visuals.arrows.strumlines.middlescroll.DefaultMode.calculate(ctx);
        
        if (ctx.playAsOpponent) {
            layout.centerOpponent = ctx.screenWidth / 2;
            layout.centerPlayer = ctx.screenWidth / 2;
            layout.gapPlayer = ctx.screenWidth * 0.55;
            layout.showOppBg = false;
        } else {
            layout.centerPlayer = ctx.screenWidth / 2;
            layout.centerOpponent = ctx.screenWidth / 2;
            layout.gapOpp = ctx.screenWidth * 0.55;
            layout.showPlayerBg = false;
        }
        
        return layout;
    }
}

funkin.play.visuals.arrows.strumlines.middlescroll.SplitMode = SplitMode;