class JudgmentPopUpManager {
    constructor(scene) {
        this.scene = scene;
        this.skinData = funkin.play && funkin.play.uiSkins ? funkin.play.uiSkins.get('ui.judgments') : null;
        this.activePopups = [];
        this.setupEvents();
        this.scene.events.on('ui_skin_changed', this.reloadJudgmentSkin, this);
    }

    reloadJudgmentSkin() {
        if (!funkin.play || !funkin.play.uiSkins) return;
        this.skinData = funkin.play.uiSkins.get('ui.judgments');
    }

    setupEvents() {
        if (funkin.playNotes) {
            funkin.playNotes.event('noteHit', (hitData) => {
                // 🚨 RESTRICCIÓN DE BOTPLAY: No mostrar judgments si es automático
                if (window.autoplay || hitData.isAuto) return;

                const getStoredOption = (key) => {
                    if (typeof funkin !== 'undefined' && funkin.play && funkin.play.options && funkin.play.options[key] !== undefined) return funkin.play.options[key];
                    try {
                        const keys = ['genesis_options', 'funkin_options', 'options', 'play_options', 'game_options'];
                        for (let i = 0; i < keys.length; i++) {
                            let val = localStorage.getItem(keys[i]);
                            if (val) {
                                let p = JSON.parse(val);
                                if (p[key] !== undefined) return p[key];
                            }
                        }
                    } catch(e) {}
                    return false;
                };

                const is2P = getStoredOption("twoPlayerLocal") === true;
                const playAsOpponent = funkin.play && funkin.play.options && funkin.play.options.playAsOpponent === true;
                const isMyNote = playAsOpponent ? !hitData.isPlayer : hitData.isPlayer;

                if ((isMyNote || is2P) && hitData.pressed && hitData.judgment !== 'miss') {
                    this.spawnJudgment(hitData.judgment, hitData.isPlayer, is2P);
                }
            });
        }
    }

    getFallbackAsset(targetJudgment) {
        if (!this.skinData) return null;
        const hierarchy = ['perfect', 'sick', 'good', 'bad', 'shit'];
        let startIndex = hierarchy.indexOf(targetJudgment);
        if (startIndex === -1) startIndex = 1; 

        for (let i = startIndex; i < hierarchy.length; i++) {
            const jData = this.skinData[hierarchy[i]];
            if (jData && jData.assetPath) {
                return { path: jData.assetPath, scale: jData.scale || 0.65, name: hierarchy[i] };
            }
        }
        return null;
    }

    spawnJudgment(judgmentStr, isPlayerSide, is2P) {
        const assetInfo = this.getFallbackAsset(judgmentStr);
        if (!assetInfo) return;

        const sessionKey = funkin.play.uiSkins.getAssetKey(assetInfo.path);
        if (!this.scene.textures.exists(sessionKey)) return;

        // --- APLICAR FILTRO ANTIALIASING ---
        const isAntialiased = typeof funkin.play.uiSkins.getAntialiasing === 'function' ? funkin.play.uiSkins.getAntialiasing() : true;
        const filterMode = isAntialiased ? Phaser.Textures.FilterMode.LINEAR : Phaser.Textures.FilterMode.NEAREST;
        this.scene.textures.get(sessionKey).setFilter(filterMode);
        // ------------------------------------

        const mode = funkin.play?.options?.popupMode || 'normal';

        if (mode === 'stacking') {
            this.activePopups.forEach(sprite => {
                if (sprite && sprite.active) {
                    this.scene.tweens.killTweensOf(sprite);
                    sprite.destroy();
                }
            });
            this.activePopups = [];
        }

        let x = this.scene.scale.width / 2;
        
        if (is2P) {
            x = isPlayerSide ? (this.scene.scale.width * 0.75) : (this.scene.scale.width * 0.25);
        } else if (funkin.play?.options?.middlescroll) {
            x = (this.scene.scale.width / 2) + 320; 
        }

        const y = (this.scene.scale.height / 2) - 40;

        const sprite = this.scene.add.sprite(x, y, sessionKey);
        sprite.setScale(assetInfo.scale);
        sprite.setOrigin(0.5, 0.5);
        sprite.setDepth(1500); 
        
        if (funkin.play.data.camera && funkin.play.data.camera.addObjToUI) {
            funkin.play.data.camera.addObjToUI(sprite);
        } else {
            sprite.setScrollFactor(0);
        }

        const bpm = funkin.play.chart ? (funkin.play.chart.get('metadata.audio.bpm') || 120) : 120;
        const beatLengthMs = (60 / bpm) * 1000;

        if (mode === 'stacking') {
            sprite.vel = { x: 0, y: 0 };
            sprite.acc = { y: 0 };

            this.scene.tweens.add({
                targets: sprite,
                alpha: 0,
                delay: beatLengthMs * 1,
                duration: 200,
                onComplete: () => {
                    const idx = this.activePopups.indexOf(sprite);
                    if (idx !== -1) this.activePopups.splice(idx, 1);
                    if (sprite.active) sprite.destroy();
                }
            });
        } else if (mode === 'bubble') {
            sprite.vel = { x: 0, y: -45 };
            sprite.acc = { y: 0 };
            sprite.setScale(assetInfo.scale * 0.7);

            this.scene.tweens.add({
                targets: sprite,
                scaleX: assetInfo.scale * 1.05,
                scaleY: assetInfo.scale * 1.05,
                duration: beatLengthMs * 1,
                ease: 'Sine.easeOut'
            });

            this.scene.tweens.add({
                targets: sprite,
                alpha: 0,
                delay: beatLengthMs * 0.8,
                duration: beatLengthMs * 0.4,
                onComplete: () => {
                    const idx = this.activePopups.indexOf(sprite);
                    if (idx !== -1) this.activePopups.splice(idx, 1);
                    if (sprite.active) sprite.destroy();
                }
            });
        } else {
            sprite.vel = {
                x: Phaser.Math.Between(-5, 5),
                y: -Phaser.Math.Between(140, 175)
            };
            sprite.acc = { y: 550 };
            sprite.alpha = 1;

            this.scene.tweens.add({
                targets: sprite,
                alpha: 0,
                delay: beatLengthMs * 1,
                duration: 200,
                onComplete: () => {
                    const idx = this.activePopups.indexOf(sprite);
                    if (idx !== -1) this.activePopups.splice(idx, 1);
                    if (sprite.active) sprite.destroy();
                }
            });
        }

        this.activePopups.push(sprite);
    }

    update(time, delta) {
        const dt = delta / 1000;
        this.activePopups.forEach(sprite => {
            if (sprite && sprite.active) {
                sprite.vel.y += sprite.acc.y * dt;
                sprite.x += sprite.vel.x * dt;
                sprite.y += sprite.vel.y * dt;
            }
        });
    }

    destroy() {
        this.scene.events.off('ui_skin_changed', this.reloadJudgmentSkin, this);
        this.activePopups.forEach(sprite => {
            if (sprite && sprite.active) {
                this.scene.tweens.killTweensOf(sprite);
                sprite.destroy();
            }
        });
        this.activePopups = [];
    }
}

funkin.play.visuals.ui.JudgmentPopUpManager = JudgmentPopUpManager;