/**
 * @file src/funkin/play/visuals/UI/judgment/popup/comboPopUp.js
 */

class ComboPopUpManager {
    constructor(scene) {
        this.scene = scene;
        this.skinData = funkin.play && funkin.play.uiSkins ? funkin.play.uiSkins.get('ui.comboNumbers') : null;
        this.activePopups = [];
        this.setupEvents();
        this.scene.events.on('ui_skin_changed', this.reloadComboSkin, this);
    }

    reloadComboSkin() {
        if (!funkin.play || !funkin.play.uiSkins) return;
        this.skinData = funkin.play.uiSkins.get('ui.comboNumbers');
    }

    setupEvents() {
        if (funkin.playNotes) {
            funkin.playNotes.event('noteHit', (hitData) => {
                const playAsOpponent = funkin.play && funkin.play.options && funkin.play.options.playAsOpponent === true;
                const isMyNote = playAsOpponent ? !hitData.isPlayer : hitData.isPlayer;

                if (isMyNote && hitData.pressed && hitData.judgment !== 'miss') {
                    const currentCombo = funkin.playerStaticsInSong ? funkin.playerStaticsInSong.combo : 0;
                    if (currentCombo > 0) {
                        this.spawnCombo(currentCombo);
                    }
                }
            });
        }
    }

    spawnCombo(comboNum) {
        const comboStr = String(comboNum).padStart(3, '0');
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

        let xBase = (this.scene.scale.width / 2) - 50;
        
        if (funkin.play?.options?.middlescroll) {
            xBase = (this.scene.scale.width / 2) + 320; 
        }

        const yBase = (this.scene.scale.height / 2) + 10;

        const globalScale = this.skinData?.globalScale || 1.0;
        const globalAlpha = this.skinData?.globalAlpha || 1.0;

        let currentX = xBase;
        let prevSpriteHalfWidth = 0;

        const bpm = funkin.play.chart ? (funkin.play.chart.get('metadata.audio.bpm') || 120) : 120;
        const beatLengthMs = (60 / bpm) * 1000;

        for (let i = 0; i < comboStr.length; i++) {
            const digit = comboStr[i];
            const assetPath = this.skinData?.assets ? this.skinData.assets[digit] : `popUp/num/num${digit}`;
            
            if (!assetPath) continue;
            
            const sessionKey = funkin.play.uiSkins.getAssetKey(assetPath);
            if (!this.scene.textures.exists(sessionKey)) continue;

            const sprite = this.scene.add.sprite(0, yBase, sessionKey);
            sprite.setAlpha(globalAlpha);
            sprite.setOrigin(0.5, 0.5);
            sprite.setDepth(1500);

            if (mode === 'bubble') {
                sprite.setScale(globalScale * 0.35);
            } else {
                sprite.setScale(globalScale * 0.5);
            }

            // Calculamos el ancho basandonos en el scale final deseado (0.5) para que no haya desajustes en bubble
            const currentHalfWidth = (sprite.width * (globalScale * 0.5)) / 2;

            if (i === 0) {
                currentX = xBase;
            } else {
                currentX += prevSpriteHalfWidth + currentHalfWidth; 
            }
            
            sprite.x = currentX;
            prevSpriteHalfWidth = currentHalfWidth;

            if (funkin.playCamera && funkin.playCamera.addObjToUI) {
                funkin.playCamera.addObjToUI(sprite);
            } else {
                sprite.setScrollFactor(0);
            }

            if (mode === 'stacking') {
                sprite.vel = { x: 0, y: 0 };
                sprite.acc = { y: 0 };

                this.scene.tweens.add({
                    targets: sprite,
                    alpha: 0,
                    delay: beatLengthMs * 2,
                    duration: 200,
                    onComplete: () => {
                        const idx = this.activePopups.indexOf(sprite);
                        if (idx !== -1) this.activePopups.splice(idx, 1);
                        if (sprite.active) sprite.destroy();
                    }
                });
            } else if (mode === 'bubble') {
                sprite.vel = { x: 0, y: -40 };
                sprite.acc = { y: 0 };

                this.scene.tweens.add({
                    targets: sprite,
                    scaleX: globalScale * 0.55,
                    scaleY: globalScale * 0.55,
                    duration: beatLengthMs * 1,
                    ease: 'Sine.easeOut'
                });

                this.scene.tweens.add({
                    targets: sprite,
                    alpha: 0,
                    delay: beatLengthMs * 1.5,
                    duration: beatLengthMs * 0.5,
                    onComplete: () => {
                        const idx = this.activePopups.indexOf(sprite);
                        if (idx !== -1) this.activePopups.splice(idx, 1);
                        if (sprite.active) sprite.destroy();
                    }
                });
            } else {
                sprite.vel = {
                    x: Phaser.Math.Between(-5, 5),
                    y: -Phaser.Math.Between(130, 150)
                };
                sprite.acc = { y: Phaser.Math.Between(250, 300) };

                this.scene.tweens.add({
                    targets: sprite,
                    alpha: 0,
                    delay: beatLengthMs * 2,
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
        this.scene.events.off('ui_skin_changed', this.reloadComboSkin, this);
        this.activePopups.forEach(sprite => {
            if (sprite && sprite.active) {
                this.scene.tweens.killTweensOf(sprite);
                sprite.destroy();
            }
        });
        this.activePopups = [];
    }
}

funkin.ComboPopUpManager = ComboPopUpManager;