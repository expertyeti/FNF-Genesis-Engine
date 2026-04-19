/**
 * @file CharacterLogic.js
 * Controlador de Lógica y Animación. Regresa a los personajes al estado IDLE
 * automáticamente cuando se agota su tiempo de canto.
 */

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.characters = funkin.play.visuals.characters || {};

class CharacterLogic {
    constructor(scene) {
        this.scene = scene;
        const NoteDir = funkin.play.visuals.arrows.notes.NoteDirection || window.funkin.NoteDirection;
        this.directions = NoteDir ? NoteDir.getMappings().names : ["left", "down", "up", "right"];
    }

    onBeat(currentBeat) {
        if (!this.scene.activeCharacters) return;

        const isCountdown = funkin.CountDown && funkin.CountDown.isInCountdown;

        this.scene.activeCharacters.forEach(char => {
            if (!char || !char.active) return;

            const isSinging = char.currentAnim && (char.currentAnim.startsWith("sing") || char.currentAnim === "hey");
            
            if (isSinging && !isCountdown && char.resetTimer > 0) return;

            if (char.danceMode === "danceLeftRight") {
                char.danced = !char.danced;
                this.playAnim(char, char.danced ? "danceRight" : "danceLeft", true);
            } else {
                this.playAnim(char, "idle", true);
            }
        });
    }

    sing(isPlayerSide, lane) {
        if (!this.scene.activeCharacters) return;
        
        const dirName = this.directions[lane];
        if (!dirName) return;

        const animName = `sing${dirName.toUpperCase()}`;

        this.scene.activeCharacters.forEach(char => {
            if ((isPlayerSide && char.isPlayer) || (!isPlayerSide && char.isOpponent)) {
                this.playAnim(char, animName, true); // forced=true (se reiniciará si es la misma tecla)
                this.updateHoldTimer(char);
            }
        });
    }

    playMiss(isPlayerSide, lane) {
        if (!this.scene.activeCharacters) return;
        
        const dirName = this.directions[lane];
        if (!dirName) return;

        const animName = `sing${dirName.toUpperCase()}miss`;

        this.scene.activeCharacters.forEach(char => {
            if ((isPlayerSide && char.isPlayer) || (!isPlayerSide && char.isOpponent)) {
                const fullAnimKey = `${char.texture.key}_${animName}`;
                if (this.scene.anims.exists(fullAnimKey)) {
                    this.playAnim(char, animName, true);
                } else {
                    this.playAnim(char, `sing${dirName.toUpperCase()}`, true);
                }
                
                this.updateHoldTimer(char);
            }
        });
    }

    playSpecial(char, animName, holdMultiplier = 1.0) {
        if (!char || !char.active) return;
        this.playAnim(char, animName, true);
        this.updateHoldTimer(char, holdMultiplier);
    }

    playAnim(char, animName, forced = false) {
        const Renderer = funkin.play.visuals.characters.CharacterRenderer;
        if (Renderer) {
            Renderer.playAnim(char, animName, forced);
        }
    }

    updateHoldTimer(char, multiplier = 1.0) {
        const bpm = funkin.play.chart ? (funkin.play.chart.get('metadata.audio.bpm') || 120) : 120;
        const stepCrochet = ((60 / bpm) * 1000) / 4; 
        
        const timeToHold = stepCrochet * (char.holdTime || 4.0) * multiplier;
        
        if (window.funkin.conductor) {
            char.resetTimer = window.funkin.conductor.songPosition + timeToHold;
        } else {
            char.resetTimer = this.scene.time.now + timeToHold;
        }
    }

    update(time, delta) {
        if (!this.scene.activeCharacters) return;
        
        const currentSongPos = window.funkin.conductor ? window.funkin.conductor.songPosition : this.scene.time.now;

        this.scene.activeCharacters.forEach(char => {
            if (!char || !char.active) return;

            // 🚨 ARREGLO DE RETORNO A IDLE 🚨
            // Cuando la nota termina y el temporizador se agota, forzamos el regreso al estado de reposo.
            if (char.resetTimer > 0 && currentSongPos >= char.resetTimer) {
                char.resetTimer = 0;
                
                if (char.danceMode === "danceLeftRight") {
                    this.playAnim(char, char.danced ? "danceRight" : "danceLeft", false);
                } else {
                    // Forzamos "idle" exactamente como viene en el JSON
                    this.playAnim(char, "idle", false);
                }
            }
        });
    }
}

funkin.play.visuals.characters.AnimateCharacters = CharacterLogic; 
funkin.play.visuals.characters.CharacterLogic = CharacterLogic;