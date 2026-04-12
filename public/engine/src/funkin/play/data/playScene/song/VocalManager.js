/**
 * @file VocalManager.js
 */

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};

class VocalManager {
    constructor(scene) {
        this.scene = scene;
        this.vocals = {
            player: null,
            opponent: null,
            generic: []
        };
        this.multiVoc = false;
        this.eventsAttached = false;
        
        this.callbacks = {
            noteHit: (data) => this.handleHit(data),
            noteMiss: (data) => this.handleMiss(data)
        };
    }

    init() {
        const audioData = funkin.play.songAudioData;
        if (!audioData || !audioData.needVoc) return;

        this.multiVoc = audioData.multiVoc;

        if (audioData.vocKeys.player) {
            this.vocals.player = this.scene.sound.add(audioData.vocKeys.player);
        }
        if (audioData.vocKeys.opponent) {
            this.vocals.opponent = this.scene.sound.add(audioData.vocKeys.opponent);
        }
        audioData.vocKeys.generic.forEach(key => {
            this.vocals.generic.push(this.scene.sound.add(key));
        });

        if (this.multiVoc) {
            this.setupEvents();
        }
    }

    play() {
        if (this.vocals.player) this.vocals.player.play();
        if (this.vocals.opponent) this.vocals.opponent.play();
        this.vocals.generic.forEach(sound => sound.play());
    }

    setupEvents() {
        if (this.eventsAttached || !funkin.playNotes) return;

        const bind = (obj, evName, cb) => {
            if (obj.on) obj.on(evName, cb, this);
            else if (obj.event) obj.event(evName, cb);
        };

        bind(funkin.playNotes, "noteHit", this.callbacks.noteHit);
        bind(funkin.playNotes, "noteMiss", this.callbacks.noteMiss);

        this.eventsAttached = true;
    }

    handleHit(data) {
        if (!data.pressed || data.judgment === "miss") return;
        const sound = data.isPlayer ? this.vocals.player : this.vocals.opponent;
        if (sound && sound.isPlaying) sound.setVolume(1.0);
    }

    handleMiss(data) {
        const sound = data.isPlayer ? this.vocals.player : this.vocals.opponent;
        if (sound && sound.isPlaying) sound.setVolume(0.0);
    }

    pause() {
        if (this.vocals.player) this.vocals.player.pause();
        if (this.vocals.opponent) this.vocals.opponent.pause();
        this.vocals.generic.forEach(sound => sound.pause());
    }

    resume() {
        if (this.vocals.player) this.vocals.player.resume();
        if (this.vocals.opponent) this.vocals.opponent.resume();
        this.vocals.generic.forEach(sound => sound.resume());
    }

    stop() {
        if (this.vocals.player) this.vocals.player.stop();
        if (this.vocals.opponent) this.vocals.opponent.stop();
        this.vocals.generic.forEach(sound => sound.stop());
    }

    destroy() {
        this.stop();
        if (funkin.playNotes && this.eventsAttached) {
            const unbind = (obj, evName, cb) => {
                if (obj.off) obj.off(evName, cb, this);
                else if (obj.removeListener) obj.removeListener(evName, cb, this);
            };
            unbind(funkin.playNotes, "noteHit", this.callbacks.noteHit);
            unbind(funkin.playNotes, "noteMiss", this.callbacks.noteMiss);
        }
        this.scene = null;
    }
}

funkin.play.VocalManager = VocalManager;