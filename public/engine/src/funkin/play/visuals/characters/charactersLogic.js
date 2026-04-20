window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.characters = funkin.play.visuals.characters || {};

/**
 * Controlador lógico de personajes.
 * Gestiona el ritmo, temporizadores de canto, combos y eventos especiales.
 */
class CharacterLogic {
    constructor(scene) {
        this.scene = scene;
        const NoteDir = funkin.play.visuals.arrows.notes.NoteDirection || window.funkin.NoteDirection;
        this.directions = NoteDir?.getMappings().names || ["left", "down", "up", "right"];

        this.comboHandler = (e) => this.handleCombo(e.detail.isPlayer, e.detail.combo);
        this.comboDropHandler = (e) => this.handleComboDrop(e.detail.isPlayer, e.detail.droppedCombo);

        document.addEventListener('funkin_combo', this.comboHandler);
        document.addEventListener('funkin_comboDrop', this.comboDropHandler);

        this.scene.events?.once('shutdown', this.cleanUp.bind(this));
        this.scene.events?.once('destroy', this.cleanUp.bind(this));
    }

    cleanUp() {
        document.removeEventListener('funkin_combo', this.comboHandler);
        document.removeEventListener('funkin_comboDrop', this.comboDropHandler);
    }

    onBeat(currentBeat) {
        const isCountdown = funkin.CountDown?.isInCountdown;

        (this.scene.activeCharacters || []).forEach(char => {
            if (!char?.active || ((char.isSinging || char.isSpecialAnim) && !isCountdown)) return;

            if (char.danceMode === "danceLeftRight") {
                char.danced = !char.danced;
                this.playAnim(char, char.danced ? "danceRight" : "danceLeft", true);
            } else if (currentBeat % 2 === 0) {
                this.playAnim(char, "idle", true);
            }
        });
    }

    sing(isPlayerSide, lane) {
        this._executeDirectionalAnim(isPlayerSide, lane, false);
    }

    playMiss(isPlayerSide, lane) {
        this._executeDirectionalAnim(isPlayerSide, lane, true);
    }

    _executeDirectionalAnim(isPlayerSide, lane, miss) {
        const dirName = this.directions[lane];
        if (!dirName) return;

        (this.scene.activeCharacters || []).forEach(char => {
            if (!char?.active) return;
            if ((isPlayerSide && char.isPlayer) || (!isPlayerSide && char.isOpponent)) {
                this.playAnim(char, `sing${dirName.toUpperCase()}${miss ? 'miss' : ''}`, true);
                this.updateHoldTimer(char);
            }
        });
    }

    handleCombo(isPlayer, combo) {
        const animName = combo === 50 ? 'combo50' : (combo === 200 ? 'combo200' : null);
        if (animName) this._triggerSpecialAnim(isPlayer, animName);
    }

    handleComboDrop(isPlayer, droppedCombo) {
        if (droppedCombo >= 70) this._triggerSpecialAnim(isPlayer, 'drop70');
    }

    _triggerSpecialAnim(isPlayer, animName) {
        (this.scene.activeCharacters || []).forEach(char => {
            if (!char?.active) return;
            
            const isTarget = (isPlayer && char.isPlayer) || (!isPlayer && char.isOpponent) || char.isSpectator;
            if (!isTarget) return;

            if (char.animKeys?.has(animName) || this.scene.anims?.exists(`${char.texture.key}_${animName}`)) {
                this.playSpecial(char, animName);
            }
        });
    }

    playSpecial(char, animName) {
        if (!char?.active) return;
        
        char.isSinging = true;
        char.isSpecialAnim = true;
        
        if (char.singTimeout) {
            this.scene.time?.removeEvent(char.singTimeout);
            char.singTimeout = null;
        }

        this.playAnim(char, animName, true);
        char.resetTimer = 0; 
    }

    playAnim(char, animName, forced = false) {
        const Renderer = funkin.play.visuals.characters.CharacterRenderer || funkin.play.visuals.characters.charactersManager;
        Renderer?.playAnim(char, animName, forced);
    }

    updateHoldTimer(char, multiplier = 1.0) {
        const bpm = funkin.play.chart?.get('metadata.audio.bpm') || 120;
        const timeToHold = (((60 / bpm) * 1000) / 4) * (char.holdTime || 4.0) * multiplier;
        
        char.resetTimer = (window.funkin.conductor?.songPosition || this.scene.time.now) + timeToHold;
    }

    update() {
        const currentSongPos = window.funkin.conductor?.songPosition || this.scene.time?.now || 0;

        (this.scene.activeCharacters || []).forEach(char => {
            if (!char?.active || char.isSpecialAnim || char.resetTimer <= 0 || currentSongPos < char.resetTimer) return;

            char.resetTimer = 0;
            this.playAnim(char, char.danceMode === "danceLeftRight" ? (char.danced ? "danceRight" : "danceLeft") : "idle", false);
        });
    }
}

funkin.play.visuals.characters.AnimateCharacters = CharacterLogic; 
funkin.play.visuals.characters.CharacterLogic = CharacterLogic;