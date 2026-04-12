/**
 * @file src/funkin/play/visuals/arrows/notes/note/logic/playMissSound.js
 */
window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.arrows = funkin.play.visuals.arrows || {};
funkin.play.visuals.arrows.notes = funkin.play.visuals.arrows.notes || {};

funkin.play.visuals.arrows.notes.NoteLogic.prototype.playMissSound = function (isPlayerSide, isAuto) {
    const getStoredOption = (key) => {
        if (typeof funkin !== 'undefined' && funkin.play && funkin.play.options && funkin.play.options[key] !== undefined) return funkin.play.options[key];
        try {
            const val = localStorage.getItem("fnf_" + key) || localStorage.getItem(key);
            if (val === "true") return true;
            if (val === "false") return false;
            return val;
        } catch(e) {}
        return false;
    };

    const is2P = getStoredOption("twoPlayerLocal") === true;

    let targetScene = this.scene || 
                      (this.note && this.note.scene) || 
                      (this.manager && this.manager.scene) || 
                      (window.funkin && window.funkin.playScene);

    if (!targetScene && window.funkin && window.funkin.game) {
        const scenes = window.funkin.game.scene.scenes;
        targetScene = scenes.find(s => s.sys.isActive() && s.sound);
    }

    const shouldPlay = is2P ? true : isPlayerSide;

    if (shouldPlay && targetScene && targetScene.sound) {
        
        const missAssets = funkin.play.missSoundsAssets || [
            { key: "missnote1", path: (window.BASE_URL || "") + "assets/sounds/miss/missnote1.ogg" }, 
            { key: "missnote2", path: (window.BASE_URL || "") + "assets/sounds/miss/missnote2.ogg" }, 
            { key: "missnote3", path: (window.BASE_URL || "") + "assets/sounds/miss/missnote3.ogg" }
        ];

        const rndIndex = Phaser.Math.Between(0, missAssets.length - 1);
        const missKey = missAssets[rndIndex].key;

        if (targetScene.cache.audio.has(missKey)) {
            targetScene.sound.play(missKey, { volume: 0.6 });
        } else if (targetScene.cache.audio.has("missnote1")) {
            targetScene.sound.play("missnote1", { volume: 0.6 });
        } else {
            // CARGA EN CALIENTE DE EMERGENCIA
            // Si el audio verdaderamente no existe en cache, lo descargamos y reproducimos al instante.
            const assetToLoad = missAssets.find(m => m.key === missKey) || missAssets[0];
            
            if (assetToLoad && assetToLoad.path && !targetScene.sys.isLoadingEmergencyMiss) {
                targetScene.sys.isLoadingEmergencyMiss = true;
                
                targetScene.load.audio(assetToLoad.key, assetToLoad.path);
                
                // Evento especifico para cuando termine de cargar este archivo en particular
                targetScene.load.once('filecomplete-audio-' + assetToLoad.key, () => {
                    targetScene.sound.play(assetToLoad.key, { volume: 0.6 });
                    targetScene.sys.isLoadingEmergencyMiss = false;
                });

                // Si la URL falla (ej: error 404), liberamos la variable para no bloquear futuras cargas
                targetScene.load.once('loaderror', () => {
                    targetScene.sys.isLoadingEmergencyMiss = false;
                });
                
                targetScene.load.start();
            }
        }
    }
};