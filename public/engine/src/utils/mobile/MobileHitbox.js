/**
 * @file public/engine/src/utils/mobile/MobileHitbox.js
 */
window.funkin = window.funkin || {};
funkin.utils = funkin.utils || {};

class MobileHitbox {
    static checkAndInject(controls) {
        if (typeof window === 'undefined' || !window.game || !window.game.scene) return;
        
        const activeScenes = window.game.scene.getScenes(true); 
        
        // INYECCIÓN EN GLOBAL HUD SCENE OBLIGATORIA
        const scene = activeScenes.find(s => s.scene.key === "GlobalHUDScene");
        if (!scene || !scene.sys || !scene.sys.game || !scene.cameras || !scene.cameras.main) return;
        if (!window.funkin.mobile) return; 

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
            if (key === "mobileSchedule") return "arrow"; // DEFAULT
            return false;
        };

        const removeHitboxes = () => {
            if (scene._mobileHitboxes) {
                scene._mobileHitboxes.forEach(h => { if(h && h.destroy) h.destroy(); });
                scene._mobileHitboxes = [];
                scene._mobileHitboxGraphics = [];
            }
            if (scene._evaluatePointers) {
                scene.input.off('pointerdown', scene._evaluatePointers);
                scene.input.off('pointerup', scene._evaluatePointers);
                scene.input.off('pointermove', scene._evaluatePointers);
                scene.input.off('pointerout', scene._evaluatePointers);
                scene.events.off('update', scene._evaluatePointers);
                scene._evaluatePointers = null;
            }
        };

        const schedule = getStoredOption("mobileSchedule");
        const isHitboxSchedule = window.funkin.mobile && !window.funkin.isKeyboardActive && schedule === "hitbox";

        if (!isHitboxSchedule) {
            removeHitboxes();
            return;
        }

        if (scene._mobileHitboxes && scene._mobileHitboxes.length > 0) return;

        scene._mobileHitboxes = []; 
        scene._mobileHitboxGraphics = [];

        const w = scene.scale.width / 4;
        const h = scene.scale.height;
        const actions = ['NOTE_LEFT', 'NOTE_DOWN', 'NOTE_UP', 'NOTE_RIGHT']; 
        const colors = [0xC24B99, 0x00FFFF, 0x12FA05, 0xF9393F]; 

        for (let i = 0; i < 4; i++) {
            const container = scene.add.container(w * i, 0);
            container.setDepth(100000);
            container.setScrollFactor(0);

            const inactiveTop = scene.add.graphics();
            inactiveTop.fillGradientStyle(colors[i], colors[i], 0x000000, 0x000000, 0.4, 0.4, 0, 0);
            inactiveTop.fillRect(0, 0, w, 15);
            inactiveTop.setAlpha(1);

            const activeVignette = scene.add.graphics();
            const strokeSize = 6;
            activeVignette.fillStyle(colors[i], 0.1); 
            activeVignette.fillRect(0, 0, w, h);
            activeVignette.lineStyle(strokeSize, colors[i], 0.8); 
            activeVignette.strokeRect(strokeSize/2, strokeSize/2, w - strokeSize, h - strokeSize);
            activeVignette.setAlpha(0);

            if (typeof funkin !== 'undefined' && funkin.playCamera && funkin.playCamera.ui) {
                if (scene.cameras.cameras && Array.isArray(scene.cameras.cameras)) {
                    scene.cameras.cameras.forEach(cam => { if (cam !== funkin.playCamera.ui) cam.ignore(container); });
                }
            } else {
                if (scene.cameras.cameras && Array.isArray(scene.cameras.cameras)) {
                    scene.cameras.cameras.forEach(cam => { if (cam !== scene.cameras.main) cam.ignore(container); });
                }
            }

            container.add([inactiveTop, activeVignette]);
            scene._mobileHitboxes.push(container);
            scene._mobileHitboxGraphics.push({ inactive: inactiveTop, active: activeVignette });
        }

        const prevLanes = [false, false, false, false];

        scene._evaluatePointers = () => {
            const currentSchedule = getStoredOption("mobileSchedule");
            const isActive = window.funkin.mobile && !window.funkin.isKeyboardActive && currentSchedule === "hitbox";

            if (!isActive) {
                removeHitboxes();
                return;
            }

            const currentLanes = [false, false, false, false];
            const pointers = scene.input.manager.pointers.filter(p => p && p.isDown);
            if (scene.input.activePointer && scene.input.activePointer.isDown && !pointers.includes(scene.input.activePointer)) {
                pointers.push(scene.input.activePointer);
            }

            pointers.forEach(pointer => {
                const px = pointer.x;
                for (let i = 0; i < 4; i++) {
                    const laneStart = w * i;
                    const laneEnd = w * (i + 1);
                    if (px >= laneStart && px <= laneEnd) {
                        currentLanes[i] = true;
                    }
                }
            });

            for (let i = 0; i < 4; i++) {
                if (currentLanes[i] && !prevLanes[i]) {
                    if (controls && controls.simulatePress) controls.simulatePress(actions[i]);
                    if (scene._mobileHitboxGraphics[i]) {
                        scene._mobileHitboxGraphics[i].active.setAlpha(1);
                        scene._mobileHitboxGraphics[i].inactive.setAlpha(0);
                    }
                } else if (!currentLanes[i] && prevLanes[i]) {
                    if (controls && controls.simulateRelease) controls.simulateRelease(actions[i]);
                    if (scene._mobileHitboxGraphics[i]) {
                        scene._mobileHitboxGraphics[i].active.setAlpha(0);
                        scene._mobileHitboxGraphics[i].inactive.setAlpha(1);
                    }
                }
                prevLanes[i] = currentLanes[i];
            }
        };

        scene.input.on('pointerdown', scene._evaluatePointers);
        scene.input.on('pointerup', scene._evaluatePointers);
        scene.input.on('pointermove', scene._evaluatePointers);
        scene.input.on('pointerout', scene._evaluatePointers);
        scene.events.on('update', scene._evaluatePointers);
        
        // Se destruye cuando se destruye la UI móvil del juego
        scene.game.events.once('destroy_mobile_pause', removeHitboxes);
    }
}

funkin.utils.MobileHitbox = MobileHitbox;