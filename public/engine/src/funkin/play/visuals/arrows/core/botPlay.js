/**
 * @file botPlay.js
 * Lógica centralizada para el Botplay y Auto-Hits.
 */

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.arrows = funkin.play.visuals.arrows || {};

class BotPlay {
    /**
     * Ejecuta un impacto automático (Hit) para una nota.
     */
    static executeAutoHit(note, timeDiff, isTimeJumping, time, isMyNoteAuto, manager, arrayIndex) {
        note.wasHit = true;
        note.active = false;
        note.visible = false;
        note.alpha = 0;

        // 1. Enviar la orden visual a la Strumline (Brillo de impacto)
        if (!isTimeJumping && manager.strumlines && typeof manager.strumlines.playConfirm === 'function') {
            const extraTime = note.length && note.length > 0 ? note.length : 150;
            manager.strumlines.playConfirm(note.lane, note.isPlayer, time, extraTime);
        }

        // 2. Crear y Emitir la señal global idéntica a la humana (Para los Splashes y Salud)
        const hitData = {
            pressed: true,
            ms: timeDiff,
            absMs: Math.abs(timeDiff),
            judgment: "perfect", 
            score: isMyNoteAuto ? 500 : 0,
            direction: note.lane,
            isPlayer: note.isPlayer,
            isAuto: true,
            note: note // Inyectamos la nota para que los Splashes lean sus datos
        };

        if (window.funkin && window.funkin.playNotes && typeof window.funkin.playNotes.emit === 'function') {
            window.funkin.playNotes.lastHit = hitData;
            window.funkin.playNotes.emit("noteHit", hitData);
        }

        // EMITIR SEÑAL GLOBAL PARA EL CHARACTER RENDERER 
        if (manager.scene && manager.scene.events) {
            manager.scene.events.emit("noteHit", hitData);
        }

        // 3. Feedback háptico si el bot juega por nosotros
        if (isMyNoteAuto && typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(15);
        }

        // 4. Destrucción Segura en Memoria
        if (arrayIndex !== undefined && arrayIndex >= 0) {
            manager.notes.splice(arrayIndex, 1);
        } else {
            const idx = manager.notes.indexOf(note);
            if (idx !== -1) manager.notes.splice(idx, 1);
        }
        
        if (note.destroy && typeof note.destroy === 'function') {
            note.destroy();
        }
    }
}

funkin.play.visuals.arrows.BotPlay = BotPlay;