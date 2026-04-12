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

    formatTime(ms) {
        if (ms < 0 || isNaN(ms)) ms = 0;
        let s = Math.floor(ms / 1000);
        let m = Math.floor(s / 60);
        s %= 60;
        return `${m}:${s < 10 ? '0' + s : s}`;
    }

    createUI() {
        const { width, height } = this.scene.cameras.main;

        // VARIABLE DE TAMAÑO DE FUENTE SOLICITADA
        const metaFontSize = '36px';
        const rightMargin = width - 15; 

        const bg = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.75).setOrigin(0, 0);
        this.container.add(bg);

        const playScene = this.scene.playScene;
        let songName = "Unknown";
        let diff = "Normal";
        let creditsArray = ["Anonymous"];
        let curTime = 0;
        let totalTime = 0;
        let songStarted = false;

        if (playScene) {
            diff = playScene.playData?.difficulty || "Normal";
            songName = playScene.playData?.actuallyPlaying || "Unknown";
            
            if (funkin.play && funkin.play.chart && typeof funkin.play.chart.get === "function") {
                songName = funkin.play.chart.get("metadata.audio.name") || funkin.play.chart.get("metadata.song.title") || songName;
                const rawCredits = funkin.play.chart.get("metadata.credits");
                if (Array.isArray(rawCredits) && rawCredits.length > 0) creditsArray = rawCredits;
                else if (typeof rawCredits === "string") creditsArray = [rawCredits];
            }

            // Verificar si la canción ha iniciado (posición > 0)
            if (funkin.conductor && funkin.conductor.songPosition > 0) {
                curTime = funkin.conductor.songPosition;
                songStarted = true;
            }

            if (playScene.sound) {
                const instTrack = playScene.sound.getAll().find(s => s.key.toLowerCase().includes('inst'));
                if (instTrack && instTrack.duration) {
                    totalTime = instTrack.duration * 1000;
                } else {
                    const songKey = playScene.playData?.actuallyPlaying;
                    const audioObj = this.scene.cache.audio.get(songKey);
                    if (audioObj && audioObj.duration) totalTime = audioObj.duration * 1000;
                }
            }
        }

        // El tiempo solo aparece si la canción ha iniciado
        const timeString = songStarted ? `[${this.formatTime(curTime)} / ${this.formatTime(totalTime)}]` : "";
        
        let metaY, timeY, originMeta, originTime;

        if (funkin.mobile) {
            timeY = 15;
            originTime = 0;
            metaY = height - 15; 
            originMeta = 1;
        } else {
            metaY = 15;
            originMeta = 0;
            timeY = height - 15;
            originTime = 1;
        }

        const timeText = this.scene.add.text(rightMargin, timeY, timeString, {
            fontSize: metaFontSize, fontFamily: 'vcr', color: '#ffffff', align: 'right'
        }).setOrigin(1, originTime);

        const titleText = this.scene.add.text(rightMargin, metaY, songName.toUpperCase(), {
            fontSize: metaFontSize, fontFamily: 'vcr', color: '#ffffff', align: 'right'
        }).setOrigin(1, originMeta);

        const creditsText = this.scene.add.text(rightMargin, metaY + (originMeta === 0 ? 45 : -40), creditsArray[0], {
            fontSize: metaFontSize, fontFamily: 'vcr', color: '#ffffff', align: 'right'
        }).setOrigin(1, originMeta);

        const diffText = this.scene.add.text(rightMargin, metaY + (originMeta === 0 ? 90 : -80), diff.toUpperCase(), {
            fontSize: metaFontSize, fontFamily: 'vcr', color: '#ffffff', align: 'right'
        }).setOrigin(1, originMeta);

        this.container.add([timeText, titleText, creditsText, diffText]);

        if (creditsArray.length > 1) {
            let creditIdx = 0;
            this.scene.time.addEvent({
                delay: 2500, loop: true,
                callback: () => {
                    if (!this.container.visible) return;
                    this.scene.tweens.add({
                        targets: creditsText, alpha: 0, duration: 500,
                        onComplete: () => {
                            creditIdx = (creditIdx + 1) % creditsArray.length;
                            creditsText.setText(creditsArray[creditIdx]);
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
                text.setScale(0.95); 
                this.scene.add.existing(text);
            } else {
                text = this.scene.add.text(0, 0, optName, {
                    fontSize: '55px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold' 
                }).setOrigin(0, 0.5); 
            }

            this.optionTexts.push(text);
            this.container.add(text);

            if (funkin.mobile) {
                // Sincronizar Hitbox: Se activará y moverá con el objeto
                text.setInteractive(new Phaser.Geom.Rectangle(0, 0, 600, 80), Phaser.Geom.Rectangle.Contains);
                
                text.on('pointerup', () => {
                    if (this.isSwiping || this.isAccepting) return;
                    if (this.curSelected === i) this.acceptSelection();
                    else {
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
        if (!funkin.mobile) {
            this.scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
                if (!this.container.visible || this.isAccepting) return;
                if (deltaY > 0) this.changeSelection(1);
                else if (deltaY < 0) this.changeSelection(-1);
            });
        }

        if (funkin.mobile) {
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
        if (change !== 0) this.playSound('scrollMenu');
        this.curSelected += change;
        if (this.curSelected < 0) this.curSelected = this.options.length - 1;
        if (this.curSelected >= this.options.length) this.curSelected = 0;
        this.updateItemPositions(false);
    }

    updateItemPositions(snap = false) {
        const centerY = this.scene.cameras.main.height / 2;
        this.optionTexts.forEach((txt, i) => {
            const isSelected = (i === this.curSelected);
            const dist = Math.abs(i - this.curSelected);
            
            if (txt.setAlpha) txt.setAlpha(isSelected ? 1 : 0.5);

            const targetY = centerY + ((i - this.curSelected) * 115);
            const baseTargetX = 80 - (dist * 25);
            
            this.scene.tweens.killTweensOf(txt); 

            if (snap) { 
                txt.y = targetY; 
                txt.x = baseTargetX; 
            } else { 
                const targetX = isSelected ? baseTargetX + 10 : baseTargetX;

                this.scene.tweens.add({ 
                    targets: txt, 
                    y: targetY, 
                    x: targetX, 
                    duration: 110, 
                    ease: 'Cubic.easeOut',
                    onUpdate: () => {
                        // FIX ÁREA TÁCTIL: Re-sincroniza la posición de la interacción durante la animación
                        if (funkin.mobile && txt.input) {
                            txt.input.hitArea.x = 0; 
                            txt.input.hitArea.y = 0;
                        }
                    },
                    onComplete: () => {
                        if (isSelected) {
                            this.scene.tweens.add({
                                targets: txt,
                                x: baseTargetX,
                                duration: 110,
                                ease: 'Cubic.easeIn'
                            });
                        }
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
            this.prevUp = funkin.controls.UI_UP_P; 
            this.prevDown = funkin.controls.UI_DOWN_P; 
            this.prevAccept = funkin.controls.ACCEPT_P;
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
        
        const action = this.optionsData[this.curSelected].action;
        if (action === 'resume') funkin.play.visuals.ui.PauseFunctions.resume(this.scene);
        else if (action === 'restart') funkin.play.visuals.ui.PauseFunctions.restart(this.scene);
        else if (action === 'exit') funkin.play.visuals.ui.PauseFunctions.exit(this.scene);
    }
}

funkin.play.visuals.ui.PauseSubSceneMenu = PauseSubSceneMenu;