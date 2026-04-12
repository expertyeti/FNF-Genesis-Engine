/**
 * Modulo orquestador del calculo posicional de las flechas.
 */

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.arrows = funkin.play.visuals.arrows || {};
funkin.play.visuals.arrows.strumlines = funkin.play.visuals.arrows.strumlines || {};

class StrumlineLayout {
  static updateLayout(strumlines) {
    if (!strumlines || !strumlines.scene) return;

    const scene = strumlines.scene;
    const screenHeight = scene.cameras.main.height;
    const screenWidth = scene.cameras.main.width;

    if (scene.input) scene.input.topOnly = false; 

    const getStoredOption = (key) => {
        if (typeof funkin !== 'undefined' && funkin.play && funkin.play.options && funkin.play.options[key] !== undefined) return funkin.play.options[key];
        try {
            const keys = ['genesis_options', 'funkin_options', 'options', 'play_options', 'game_options'];
            for (let i = 0; i < keys.length; i++) {
                let val = localStorage.getItem(keys[i]);
                if (val) {
                    let p = JSON.parse(val);
                    if (p[key] !== undefined) return p[key];
                    if (p.play && p.play.options && p.play.options[key] !== undefined) return p.play.options[key];
                    if (p.options && p.options[key] !== undefined) return p.options[key];
                }
            }
        } catch(e) {}
        if (key === "mobileSchedule") return "arrow";
        return false;
    };

    const strumlinesNamespace = funkin.play.visuals.arrows.strumlines;
    const MiddlescrollHandler = strumlinesNamespace.middlescroll && strumlinesNamespace.middlescroll.MiddlescrollHandler;
    const ScheduleClass = strumlinesNamespace.schedules && strumlinesNamespace.schedules.ArrowsSchedule;

    let layout = {
      isMobile: false, gapOpp: 0, gapPlayer: 0,
      oppSpacing: 112, playerSpacing: 112,
      oppScale: 0.7, playerScale: 0.7,
      oppAlpha: 1, playerAlpha: 1,
      centerOpponent: screenWidth / 4,
      centerPlayer: (screenWidth / 4) * 3,
      playAsOpponent: false,
      oppY: 50, playerY: 50
    };

    const globalDownscroll = getStoredOption("downscroll");

    if (MiddlescrollHandler && typeof MiddlescrollHandler.calculate === "function") {
      layout = { ...layout, ...MiddlescrollHandler.calculate(scene, strumlines.keyCount) };
    }

    const schedule = getStoredOption("mobileSchedule");
    const useArrowSchedule = window.funkin.mobile && !window.funkin.isKeyboardActive && schedule === "arrow";

    if (ScheduleClass && typeof ScheduleClass.applyMobile === "function" && useArrowSchedule) {
      layout = ScheduleClass.applyMobile(layout, scene, strumlines.keyCount);
    }

    const isMobileControlsActive = typeof window.funkin.mobileControlsActive !== 'undefined' ? window.funkin.mobileControlsActive : true;
    const enableTouchHitboxes = useArrowSchedule && isMobileControlsActive;

    const oppCentersWidth = (strumlines.keyCount - 1) * layout.oppSpacing + layout.gapOpp;
    const playerCentersWidth = (strumlines.keyCount - 1) * layout.playerSpacing + layout.gapPlayer;

    const oppCenterStartX = layout.centerOpponent - oppCentersWidth / 2;
    const playerCenterStartX = layout.centerPlayer - playerCentersWidth / 2;

    const halfKeyCount = Math.floor(strumlines.keyCount / 2);
    const isOdd = strumlines.keyCount % 2 !== 0;
    const actions = ["NOTE_LEFT", "NOTE_DOWN", "NOTE_UP", "NOTE_RIGHT"];
    const actionsP2 = ["P2_NOTE_LEFT", "P2_NOTE_DOWN", "P2_NOTE_UP", "P2_NOTE_RIGHT"];

    const isTwoPlayer = getStoredOption("twoPlayerLocal") === true;

    const setupMobileHitbox = (arrow, spacing, scale, yPos, index, isPlayer2 = false) => {
      if (!arrow || !arrow.scene || !arrow.scene.sys || !arrow.scene.sys.input) return;

      if (!enableTouchHitboxes) {
        if (arrow._mobileTouchZone) {
            if (arrow._mobileTouchZone.input && arrow._mobileTouchZone.input.hitAreaDebug) {
                scene.input.removeDebug(arrow._mobileTouchZone);
                arrow._mobileTouchZone.input.hitAreaDebug.destroy();
            }
            arrow._mobileTouchZone.destroy();
            arrow._mobileTouchZone = null;
        }
        return;
      }

      if (!arrow._staticFrameWidth) arrow._staticFrameWidth = 160;
      if (!arrow._staticFrameHeight) arrow._staticFrameHeight = 160;

      // REDUCCIÓN DEL ANCHO TÁCTIL AL TAMAÑO REAL DEL SPRITE
      const hitAreaWidth = arrow._staticFrameWidth * 1.0; 
      const hitAreaHeight = screenHeight / 2; 
      
      const originX = arrow.originX !== undefined ? arrow.originX : 0.5;

      const hitX = (arrow._staticFrameWidth * originX) - (hitAreaWidth / 2);
      const globalTopY = screenHeight / 2;
      const localTopY = (globalTopY - yPos) / scale + (arrow._staticFrameHeight * 0.5);

      try {
          if (!arrow._mobileTouchZone) {
              arrow._mobileTouchZone = scene.add.zone(0, 0, hitAreaWidth, hitAreaHeight);
              arrow._mobileTouchZone.setDepth(100000);
              
              if (window.funkin.controls) {
                  const actionsArr = isPlayer2 ? actionsP2 : actions;
                  const action = actionsArr[index % actionsArr.length];
                  arrow._mobileTouchZone.setInteractive();
                  arrow._mobileTouchZone.on("pointerdown", () => window.funkin.controls.simulatePress(action));
                  arrow._mobileTouchZone.on("pointerup", () => window.funkin.controls.simulateRelease(action));
                  arrow._mobileTouchZone.on("pointerout", () => window.funkin.controls.simulateRelease(action));
                  arrow._mobileTouchZone.on("pointerover", (pointer) => { if (pointer && pointer.isDown) window.funkin.controls.simulatePress(action); });
              }
          }

          arrow._mobileTouchZone.setSize(hitAreaWidth, hitAreaHeight);
          const zoneCenterY = arrow.isDownscroll ? (screenHeight - (hitAreaHeight/2)) : (hitAreaHeight/2);
          arrow._mobileTouchZone.setPosition(targetCenterX, zoneCenterY);

          // CORRECCIÓN DIBUJADO DE DEBUG HITBOX
          if (window.funkin.showArrowBounds) {
              if (!arrow._mobileTouchZone.input.hitAreaDebug) {
                  scene.input.enableDebug(arrow._mobileTouchZone, 0xff00ff);
              }
          } else if (arrow._mobileTouchZone.input && arrow._mobileTouchZone.input.hitAreaDebug) {
              scene.input.removeDebug(arrow._mobileTouchZone);
              arrow._mobileTouchZone.input.hitAreaDebug.destroy();
              arrow._mobileTouchZone.input.hitAreaDebug = null;
          }
      } catch(e) {}
    };

    strumlines.opponentStrums.forEach((arrow, i) => {
      if (!arrow) return;
      let currentGap = 0;
      if (layout.gapOpp > 0) {
        if (isOdd && i === halfKeyCount) currentGap = layout.gapOpp / 2;
        else if (i >= Math.ceil(strumlines.keyCount / 2)) currentGap = layout.gapOpp;
      }

      const targetScale = layout.oppScale;
      const originX = arrow.originX !== undefined ? arrow.originX : 0.5;
      
      if (!arrow._staticFrameWidth || arrow.currentAction === 'static') arrow._staticFrameWidth = arrow.width;
      const expectedWidth = arrow._staticFrameWidth * targetScale;
      
      const targetCenterX = oppCenterStartX + i * layout.oppSpacing + currentGap;
      const targetX = targetCenterX - expectedWidth * (0.5 - originX);
      const targetY = layout.oppY;

      arrow.baseX = targetX;
      arrow.baseY = targetY;
      const offset = (arrow.animsOffsets && arrow.animsOffsets[arrow.currentAction]) ? arrow.animsOffsets[arrow.currentAction] : [0, 0];
      
      if (arrow.x !== 0 && arrow.baseX !== undefined) {
          scene.tweens.add({ 
              targets: arrow, baseX: targetX, baseY: targetY, scaleX: targetScale, scaleY: targetScale,
              alpha: arrow.baseAlpha !== undefined ? arrow.baseAlpha * layout.oppAlpha : layout.oppAlpha,
              duration: 250, ease: 'Sine.easeOut',
              onUpdate: () => {
                  const off = (arrow.animsOffsets && arrow.animsOffsets[arrow.currentAction]) ? arrow.animsOffsets[arrow.currentAction] : [0, 0];
                  arrow.x = arrow.baseX + off[0];
                  arrow.y = arrow.baseY + off[1];
              }
          });
      } else {
          arrow.x = targetX + offset[0]; 
          arrow.y = targetY + offset[1];
          arrow.setScale(targetScale);
          arrow.setAlpha(arrow.baseAlpha !== undefined ? arrow.baseAlpha * layout.oppAlpha : layout.oppAlpha);
      }

      arrow.downscroll = layout.oppDownscroll !== undefined ? layout.oppDownscroll : globalDownscroll;
      arrow.isDownscroll = arrow.downscroll;

      if (typeof arrow.playAnim === "function") arrow.playAnim(arrow.currentAction || "static", true);

      if (isTwoPlayer) {
          setupMobileHitbox(arrow, layout.oppSpacing, layout.oppScale, layout.oppY, i, true);
      } else if (layout.playAsOpponent) {
          setupMobileHitbox(arrow, layout.oppSpacing, layout.oppScale, layout.oppY, i, false);
      } else if (arrow._mobileTouchZone) {
          if (arrow._mobileTouchZone.input && arrow._mobileTouchZone.input.hitAreaDebug) arrow._mobileTouchZone.input.hitAreaDebug.destroy();
          arrow._mobileTouchZone.destroy();
          arrow._mobileTouchZone = null;
      }
    });

    strumlines.playerStrums.forEach((arrow, i) => {
      if (!arrow) return;
      let currentGap = 0;
      if (layout.gapPlayer > 0) {
        if (isOdd && i === halfKeyCount) currentGap = layout.gapPlayer / 2;
        else if (i >= Math.ceil(strumlines.keyCount / 2)) currentGap = layout.gapPlayer;
      }

      const targetScale = layout.playerScale;
      const originX = arrow.originX !== undefined ? arrow.originX : 0.5;
      
      if (!arrow._staticFrameWidth || arrow.currentAction === 'static') arrow._staticFrameWidth = arrow.width;
      const expectedWidth = arrow._staticFrameWidth * targetScale;
      
      const targetCenterX = playerCenterStartX + i * layout.playerSpacing + currentGap;
      const targetX = targetCenterX - expectedWidth * (0.5 - originX);
      const targetY = layout.playerY;

      arrow.baseX = targetX;
      arrow.baseY = targetY;
      const offset = (arrow.animsOffsets && arrow.animsOffsets[arrow.currentAction]) ? arrow.animsOffsets[arrow.currentAction] : [0, 0];

      if (arrow.x !== 0 && arrow.baseX !== undefined) {
          scene.tweens.add({ 
              targets: arrow, baseX: targetX, baseY: targetY, scaleX: targetScale, scaleY: targetScale,
              alpha: arrow.baseAlpha !== undefined ? arrow.baseAlpha * layout.playerAlpha : layout.playerAlpha,
              duration: 250, ease: 'Sine.easeOut',
              onUpdate: () => {
                  const off = (arrow.animsOffsets && arrow.animsOffsets[arrow.currentAction]) ? arrow.animsOffsets[arrow.currentAction] : [0, 0];
                  arrow.x = arrow.baseX + off[0];
                  arrow.y = arrow.baseY + off[1];
              }
          });
      } else {
          arrow.x = targetX + offset[0]; 
          arrow.y = targetY + offset[1];
          arrow.setScale(targetScale);
          arrow.setAlpha(arrow.baseAlpha !== undefined ? arrow.baseAlpha * layout.playerAlpha : layout.playerAlpha);
      }
      
      arrow.downscroll = layout.playerDownscroll !== undefined ? layout.playerDownscroll : globalDownscroll;
      arrow.isDownscroll = arrow.downscroll;

      if (typeof arrow.playAnim === "function") arrow.playAnim(arrow.currentAction || "static", true);

      if (!layout.playAsOpponent || isTwoPlayer) {
          setupMobileHitbox(arrow, layout.playerSpacing, layout.playerScale, layout.playerY, i, false);
      } else if (arrow._mobileTouchZone) {
          if (arrow._mobileTouchZone.input && arrow._mobileTouchZone.input.hitAreaDebug) arrow._mobileTouchZone.input.hitAreaDebug.destroy();
          arrow._mobileTouchZone.destroy();
          arrow._mobileTouchZone = null;
      }
    });

    const StrumBG = strumlinesNamespace.StrumlineBG || window.funkin.StrumlineBG;
    if (StrumBG && typeof StrumBG.update === "function") {
      StrumBG.update(strumlines, layout, screenHeight);
    }
  }
}

funkin.play.visuals.arrows.strumlines.StrumlineLayout = StrumlineLayout;