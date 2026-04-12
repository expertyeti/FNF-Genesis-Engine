class PauseSubSceneMenu {
    constructor(scene, pauseData) {
        this.scene = scene;
        this.container = scene.add.container(0, 0);
        
        this.optionsData = (pauseData && pauseData.options) ? pauseData.options : [
            { label: 'RESUME', action: 'resume' },
            { label: 'RESTART SONG', action: 'restart' },
            { label: 'EXIT TO MENU', action: 'exit' }
        ];

        this.options = this.optionsData.map(opt => opt.label.toUpperCase());
        this.optionTexts = [];
        this.curSelected = 0;
        
        this.isMobile = scene.sys.game.device.os.android || scene.sys.game.device.os.iOS;
        this.isSwiping = false;
        this.isAccepting = true; 

        this.prevUp = false;
        this.prevDown = false;
        this.prevAccept = false;

        this.createUI();
        this.setupInputs();
    }

    playSound(key) {
        const targetScene = this.scene.playScene || this.scene;
        if (targetScene && targetScene.cache.audio.exists(key)) {
            targetScene.sound.play(key, { volume: 1.0 });
        } else if (this.scene.cache.audio.exists(key)) {
            this.scene.sound.play(key, { volume: 1.0 });
        }
    }

    createUI() {
        const { width, height } = this.scene.cameras.main;

        const bg = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.75).setOrigin(0, 0);
        this.container.add(bg);

        const playScene = this.scene.playScene;
        let songName = "Unknown";
        let diff = "Normal";
        let creditsArray = ["Anonymous"];

        if (playScene) {
            diff = playScene.playData?.difficulty || "Normal";
            songName = playScene.playData?.actuallyPlaying || "Unknown";
            
            if (funkin.play && funkin.play.chart && typeof funkin.play.chart.get === "function") {
                songName = funkin.play.chart.get("metadata.audio.name") || funkin.play.chart.get("metadata.song.title") || songName;
                
                const rawCredits = funkin.play.chart.get("metadata.credits");
                if (Array.isArray(rawCredits) && rawCredits.length > 0) {
                    creditsArray = rawCredits;
                } else if (typeof rawCredits === "string") {
                    creditsArray = [rawCredits];
                }
            }
        }

        const rightMargin = width - 40;
        let titleY = 40;
        let creditsY = 90; 
        let diffY = 140; 
        let originY = 0;

        if (this.isMobile) {
            originY = 1;
            titleY = height - 120; 
            creditsY = height - 75;
            diffY = height - 30;
        }

        const titleText = this.scene.add.text(rightMargin, titleY, songName, {
            fontSize: '42px', fontFamily: 'vcr', color: '#ffffff', align: 'right'
        }).setOrigin(1, originY);
        
        const creditsText = this.scene.add.text(rightMargin, creditsY, creditsArray[0], {
            fontSize: '36px', fontFamily: 'vcr', color: '#ffffff', align: 'right'
        }).setOrigin(1, originY);

        const diffText = this.scene.add.text(rightMargin, diffY, diff, {
            fontSize: '42px', fontFamily: 'vcr', color: '#ffffff', align: 'right'
        }).setOrigin(1, originY);

        this.container.add([titleText, creditsText, diffText]);

        if (creditsArray.length > 1) {
            let currentCreditIndex = 0;
            this.scene.time.addEvent({
                delay: 2500,
                loop: true,
                callback: () => {
                    if (!this.container.visible) return;
                    this.scene.tweens.add({
                        targets: creditsText, alpha: 0, duration: 500,
                        onComplete: () => {
                            currentCreditIndex = (currentCreditIndex + 1) % creditsArray.length;
                            creditsText.setText(creditsArray[currentCreditIndex]);
                            this.scene.tweens.add({ targets: creditsText, alpha: 1, duration: 500 });
                        }
                    });
                }
            });
        }
        
        this.options.forEach((optName, i) => {
            let text;
            if (window.Alphabet) {
                text = new window.Alphabet(this.scene, 0, 0, optName, true);
                text.setScale(1.05); 
                this.scene.add.existing(text);
            } else {
                text = this.scene.add.text(0, 0, optName, {
                    fontSize: '65px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold' 
                }).setOrigin(0, 0.5); 
            }

            this.optionTexts.push(text);
            this.container.add(text);

            if (this.isMobile) {
                if (text.setSize) text.setSize(600, 80);
                text.setInteractive({ useHandCursor: true });
                
                text.on('pointerup', () => {
                    if (this.isSwiping || this.isAccepting) return;
                    if (this.curSelected === i) {
                        this.acceptSelection();
                    } else {
                        this.curSelected = i;
                        this.changeSelection(0);
                        this.playSound('scrollMenu');
                    }
                });
            }
        });

        this.updateItemPositions(true);
        this.container.setVisible(false);
    }

    setupInputs() {
        if (!this.isMobile) {
            this.scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
                if (!this.container.visible || this.isAccepting) return;
                if (deltaY > 0) this.changeSelection(1);
                else if (deltaY < 0) this.changeSelection(-1);
            });
        }

        if (this.isMobile) {
            let startY = 0;
            this.scene.input.on('pointerdown', (pointer) => {
                if (!this.container.visible || this.isAccepting) return;
                startY = pointer.y;
                this.isSwiping = false;
            });
            this.scene.input.on('pointermove', (pointer) => {
                if (!this.container.visible || !pointer.isDown || this.isAccepting) return;
                let diff = pointer.y - startY;
                if (Math.abs(diff) > 10) this.isSwiping = true;
                if (diff > 40) { this.changeSelection(-1); startY = pointer.y; }
                else if (diff < -40) { this.changeSelection(1); startY = pointer.y; }
            });
        }
    }

    changeSelection(change = 0) {
        if (!this.container.visible || this.isAccepting) return;
        
        if (change !== 0) {
            this.playSound('scrollMenu');
        }
        
        this.curSelected += change;
        if (this.curSelected < 0) this.curSelected = this.options.length - 1;
        if (this.curSelected >= this.options.length) this.curSelected = 0;
        this.updateItemPositions(false);
    }

    applyYoyoAnim(txt, baseX) {
        this.scene.tweens.add({
            targets: txt,
            x: baseX + 15, 
            duration: 600,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }

    updateItemPositions(snap = false) {
        const centerY = this.scene.cameras.main.height / 2;
        this.optionTexts.forEach((txt, i) => {
            const isSelected = (i === this.curSelected);
            const dist = Math.abs(i - this.curSelected);
            
            if (txt.setAlpha) {
                txt.setAlpha(isSelected ? 1 : 0.6);
            }

            const targetY = centerY + ((i - this.curSelected) * 120);
            const baseTargetX = 220 - (dist * 40);
            
            this.scene.tweens.killTweensOf(txt); 

            if (snap) { 
                txt.y = targetY; 
                txt.x = baseTargetX; 
                if (isSelected) this.applyYoyoAnim(txt, baseTargetX);
            } else { 
                this.scene.tweens.add({ 
                    targets: txt, 
                    y: targetY, 
                    x: baseTargetX, 
                    duration: 150, 
                    ease: 'Sine.easeOut',
                    onComplete: () => {
                        if (isSelected) this.applyYoyoAnim(txt, baseTargetX);
                    }
                }); 
            }
        });
    }

    update() {
        if (this.container.visible && funkin.controls && !this.isAccepting) {
            if (funkin.controls.UI_UP_P && !this.prevUp) this.changeSelection(-1);
            if (funkin.controls.UI_DOWN_P && !this.prevDown) this.changeSelection(1);
            if (funkin.controls.ACCEPT_P && !this.prevAccept) this.acceptSelection();
            this.prevUp = funkin.controls.UI_UP_P; this.prevDown = funkin.controls.UI_DOWN_P; this.prevAccept = funkin.controls.ACCEPT_P;
        }
    }

    setVisible(visible) {
        this.container.setVisible(visible);
        if (visible) {
            this.curSelected = 0; 
            this.updateItemPositions(true); 
            this.isAccepting = true;
            this.scene.time.delayedCall(300, () => { this.isAccepting = false; });
        }
    }

    acceptSelection() {
        if (!this.container.visible || this.isAccepting) return;
        this.isAccepting = true;
        
        // Acción instantánea, sin sonido de confirmación y sin parpadeo (flicker)
        const selectedText = this.optionTexts[this.curSelected];
        this.scene.tweens.killTweensOf(selectedText);
        
        const action = this.optionsData[this.curSelected].action;
        if (action === 'resume') funkin.play.visuals.ui.PauseFunctions.resume(this.scene);
        else if (action === 'restart') funkin.play.visuals.ui.PauseFunctions.restart(this.scene);
        else if (action === 'exit') funkin.play.visuals.ui.PauseFunctions.exit(this.scene);
    }
}

funkin.play.visuals.ui.PauseSubSceneMenu = PauseSubSceneMenu;