/**
 * @file public/engine/src/funkin/play/visuals/arrows/strumelines/middlescroll/NormalMode.js
 */
window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.arrows = funkin.play.visuals.arrows || {};
funkin.play.visuals.arrows.strumlines = funkin.play.visuals.arrows.strumlines || {};
funkin.play.visuals.arrows.strumlines.middlescroll = funkin.play.visuals.arrows.strumlines.middlescroll || {};

class NormalMode {
    static calculate(ctx) {
        const layout = funkin.play.visuals.arrows.strumlines.middlescroll.DefaultMode.calculate(ctx);
        const activeSpacing = ctx.BASE_SPACING;

        if (ctx.playAsOpponent) {
            layout.playerScale = ctx.skinScale * 0.55;
            layout.playerSpacing = ctx.BASE_SPACING * 0.60;
            layout.playerAlpha = 0.35;
            layout.showPlayerBg = false;

            layout.centerOpponent = ctx.screenWidth / 2;
            layout.oppY = ctx.DEFAULT_Y; // Sin offset extra
            layout.oppScale = ctx.skinScale;
            layout.oppSpacing = activeSpacing;

            const playerWidthHalf = (layout.playerSpacing * (ctx.keys - 1)) / 2;
            layout.centerPlayer = ctx.screenWidth - ctx.edgeMargin - playerWidthHalf;
            layout.playerY = ctx.DEFAULT_Y; // Sin offset extra
        } else {
            layout.oppScale = ctx.skinScale * 0.55;
            layout.oppSpacing = ctx.BASE_SPACING * 0.60;
            layout.oppAlpha = 0.35;
            layout.showOppBg = false;

            layout.centerPlayer = ctx.screenWidth / 2;
            layout.playerY = ctx.DEFAULT_Y; // Sin offset extra
            layout.playerScale = ctx.skinScale;
            layout.playerSpacing = activeSpacing;

            const oppWidthHalf = (layout.oppSpacing * (ctx.keys - 1)) / 2;
            layout.centerOpponent = ctx.edgeMargin + oppWidthHalf;
            layout.oppY = ctx.DEFAULT_Y; // Sin offset extra
        }
        return layout;
    }
}

funkin.play.visuals.arrows.strumlines.middlescroll.NormalMode = NormalMode;