// src/utils/mobile/MobilePauseBtn.js
window.funkin = window.funkin || {};
funkin.utils = funkin.utils || {};

class MobilePauseBtn {
  static customIgnoredScenes = [];

  static addIgnoredScene(sceneKey) {
    if (!this.customIgnoredScenes.includes(sceneKey)) {
      this.customIgnoredScenes.push(sceneKey);
    }
  }

  static getLayout(scene) {
      const padding = 90; 
      const baseX = scene.cameras.main.width - padding;
      const baseY = padding;

      return {
          circleX: baseX + 7, 
          circleY: baseY + 6, 
          circleScale: 0.66,
          buttonScale: 0.76
      };
  }

  static checkAndInject(controls) {
    if (typeof window === "undefined" || !window.game || !window.game.scene) return;

    const activeScenes = window.game.scene.getScenes(true);
    let scene = activeScenes.find((s) => s.scene.key === "GlobalHUDScene");
    
    if (!scene) {
      const ignoredScenes = ["FlashEffect", "TransitionScene", "PauseSubScene", ...this.customIgnoredScenes];
      scene = activeScenes.slice().reverse().find((s) => !ignoredScenes.includes(s.scene.key));
    }

    if (!scene || !scene.sys || !scene.sys.game) return;

    if (!scene._keyboardMobileDisablerAdded && scene.input && scene.input.keyboard) {
        scene.input.keyboard.on('keydown', () => {
            if (window.funkin.isKeyboardActive) return; 
            window.funkin.isKeyboardActive = true;
            if (scene.game && scene.game.events) scene.game.events.emit('device_input_changed', false);
        });
        scene._keyboardMobileDisablerAdded = true;
    }

    if (!scene._touchMobileEnablerAdded && scene.input) {
        scene.input.on('pointerdown', (pointer) => {
            const isTouch = pointer.pointerType === 'touch' || (window.funkin.mobile && pointer.pointerType !== 'mouse');
            if (isTouch && window.funkin.isKeyboardActive) {
                window.funkin.isKeyboardActive = false;
                if (scene.game && scene.game.events) scene.game.events.emit('device_input_changed', true);
            }
        });
        scene._touchMobileEnablerAdded = true;
    }

    if (!window.funkin.mobile) return;
    if (scene._mobilePauseHidden) return; 
    if (scene._pauseContainer && scene._pauseContainer.active) {
        const isKeyboard = window.funkin.isKeyboardActive === true;
        scene._pauseContainer.setAlpha(isKeyboard ? 0 : 1);
        if (isKeyboard && scene._pauseButtonSprite) scene._pauseButtonSprite.disableInteractive();
        else if (scene._pauseButtonSprite) scene._pauseButtonSprite.setInteractive({ useHandCursor: true });
        return;
    }
    if (scene._isInjectingPause) return;

    scene._isInjectingPause = true;

    const atlasKey = "mobile_pause_button";
    const circleKey = "mobile_pause_circle";
    let loadsPending = 0;

    if (!scene.textures.exists(atlasKey)) {
      loadsPending++;
      scene.load.atlasXML(atlasKey, window.BASE_URL + "assets/images/ui/pauseButton.png", window.BASE_URL + "assets/images/ui/pauseButton.xml");
    }

    if (!scene.textures.exists(circleKey)) {
      loadsPending++;
      scene.load.image(circleKey, window.BASE_URL + "assets/images/ui/pauseCircle.png");
    }

    if (loadsPending > 0) {
      scene.load.once("complete", () => {
        this._createPauseUI(scene, atlasKey, circleKey, controls);
      });
      scene.load.start();
    } else {
      this._createPauseUI(scene, atlasKey, circleKey, controls);
    }
  }

  static _createPauseUI(scene, atlasKey, circleKey, controls) {
    scene._isInjectingPause = false;

    if (!scene.anims.exists("pause_idle")) {
      scene.anims.create({
        key: "pause_idle",
        frames: [{ key: atlasKey, frame: "pause0000" }],
        frameRate: 24
      });
    }

    const layout = this.getLayout(scene);

    const pauseContainer = scene.add.container(0, 0);
    pauseContainer.setDepth(100000);
    pauseContainer.setScrollFactor(0);

    const pauseCircle = scene.add.sprite(layout.circleX, layout.circleY, circleKey);
    pauseCircle.setOrigin(0.5, 0.5); 
    pauseCircle.setScale(layout.circleScale);
    pauseCircle.setAlpha(0.35);

    const pauseButton = scene.add.sprite(0, 0, atlasKey);
    pauseButton.setOrigin(0, 0);
    pauseButton.setScale(layout.buttonScale);
    
    try { pauseButton.play("pause_idle"); } catch(e) {}

    pauseButton.setPosition(
        pauseCircle.x - (pauseButton.displayWidth / 2) - 6,
        pauseCircle.y - (pauseButton.displayHeight / 2) - 3
    );

    pauseContainer.add([pauseCircle, pauseButton]);

    const isMobileControls = typeof window.funkin.mobileControlsActive === 'undefined' || window.funkin.mobileControlsActive;
    pauseContainer.setAlpha((isMobileControls && !window.funkin.isKeyboardActive) ? 1 : 0);
    if (!isMobileControls || window.funkin.isKeyboardActive) pauseButton.disableInteractive();

    if (scene.cameras.cameras) {
      scene.cameras.cameras.forEach((cam) => {
        if (cam !== scene.cameras.main) cam.ignore(pauseContainer);
      });
    }

    pauseButton.setInteractive({ useHandCursor: true });

    pauseButton.on("pointerdown", () => {
      if (pauseButton.isExecuting) return;
      pauseButton.isExecuting = true;

      scene.tweens.add({
          targets: pauseButton,
          scaleX: layout.buttonScale + 0.05,
          scaleY: layout.buttonScale + 0.05,
          duration: 100,
          yoyo: true, 
          ease: 'Sine.easeInOut'
      });

      if (controls && controls.simulatePress) controls.simulatePress("PAUSE");
      setTimeout(() => {
        if (controls && controls.simulateRelease) controls.simulateRelease("PAUSE");
      }, 50);
    });

    scene._pauseContainer = pauseContainer;
    scene._pauseCircleSprite = pauseCircle;
    scene._pauseButtonSprite = pauseButton;

    if (!scene._pauseEventsAdded) {
      scene.game.events.on('destroy_mobile_pause', () => {
          scene._mobilePauseHidden = true; 
          if (scene._pauseContainer) {
              scene.tweens.killTweensOf(scene._pauseContainer);
              scene._pauseContainer.destroy();
              scene._pauseContainer = null;
              scene._pauseButtonSprite = null;
              scene._pauseCircleSprite = null;
          }
      });

      scene.game.events.on('hide_mobile_pause', () => {
          scene._mobilePauseHidden = true; 
          if (scene._pauseContainer) {
              scene._pauseContainer.destroy();
              scene._pauseContainer = null;
              scene._pauseButtonSprite = null;
              scene._pauseCircleSprite = null;
          }
      });

      scene.game.events.on('show_mobile_pause', () => {
          scene._mobilePauseHidden = false; 
          if (!scene._pauseContainer) {
              this._createPauseUI(scene, atlasKey, circleKey, controls);
              if (scene._pauseContainer && (typeof window.funkin.mobileControlsActive === 'undefined' || window.funkin.mobileControlsActive)) {
                  scene._pauseContainer.setAlpha(0);
                  scene.tweens.add({ targets: scene._pauseContainer, alpha: 1, duration: 200, ease: 'Linear' });
              }
          }
      });

      scene.game.events.on('device_input_changed', (isMobile) => {
          if (!scene._pauseContainer || !scene._pauseContainer.active) return;
          
          const targetAlpha = isMobile ? 1 : 0;
          if (scene._pauseContainer.alpha !== targetAlpha) {
              if (isMobile) scene._pauseButtonSprite.setInteractive({ useHandCursor: true });
              else scene._pauseButtonSprite.disableInteractive();

              scene.tweens.add({
                  targets: scene._pauseContainer,
                  alpha: targetAlpha,
                  duration: 300
              });
          }
      });

      scene._pauseEventsAdded = true;
    }
  }

  static playTransitionIn(pauseScene) {
      if (!window.funkin.mobile || window.funkin.isKeyboardActive) return; 

      const atlasKey = "mobile_pause_button";
      const circleKey = "mobile_pause_circle";
      
      if (!pauseScene.textures.exists(atlasKey) || !pauseScene.textures.exists(circleKey)) return;

      if (!pauseScene.anims.exists("pause_confirm")) {
          pauseScene.anims.create({
              key: "pause_confirm",
              frames: pauseScene.anims.generateFrameNames(atlasKey, { prefix: "pause", start: 6, end: 32, zeroPad: 4 }),
              frameRate: 24,
              repeat: 0,
          });
      }

      const layout = this.getLayout(pauseScene);
      const container = pauseScene.add.container(0, 0);
      container.setDepth(1000000); 

      const animCircle = pauseScene.add.sprite(layout.circleX, layout.circleY, circleKey);
      animCircle.setOrigin(0.5, 0.5);
      animCircle.setScale(layout.circleScale * 1.4); 
      animCircle.setAlpha(0.35);

      const animButton = pauseScene.add.sprite(0, 0, atlasKey);
      animButton.setOrigin(0, 0); 
      animButton.setScale(layout.buttonScale + 0.05);
      animButton.play("pause_confirm");

      animButton.setPosition(
          animCircle.x - (animButton.displayWidth / 2) - 6,
          animCircle.y - (animButton.displayHeight / 2) - 3
      );

      container.add([animCircle, animButton]);

      if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(50); 
          setTimeout(() => navigator.vibrate(10), 200);
      }

      pauseScene.tweens.add({
          targets: animButton,
          scaleX: layout.buttonScale,
          scaleY: layout.buttonScale,
          duration: 150,
          ease: 'Sine.easeOut'
      });

      pauseScene.tweens.add({
          targets: animCircle,
          scaleX: layout.circleScale,
          scaleY: layout.circleScale,
          duration: 400,
          ease: 'Back.easeInOut'
      });

      pauseScene.tweens.add({
          targets: animCircle,
          alpha: 0,
          duration: 600,
          ease: 'Quartic.easeOut'
      });

      pauseScene.time.delayedCall(300, () => {
          pauseScene.tweens.add({
              targets: animButton,
              alpha: 0,
              duration: 600,
              ease: 'Quartic.easeOut',
              onComplete: () => { if (container) container.destroy(); }
          });
      });
  }
}

funkin.utils.MobilePauseBtn = MobilePauseBtn;