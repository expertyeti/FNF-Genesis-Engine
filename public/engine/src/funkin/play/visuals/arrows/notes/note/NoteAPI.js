class NoteAPI {
	constructor(manager) {
		this.manager = manager;
	}

	init() {
		const self = this;
		const existingListeners = funkin.playNotes ? funkin.playNotes._listeners : {};
		const existingGlobals = funkin.playNotes ? funkin.playNotes._globalListeners : [];

		funkin.playNotes = {
			_listeners: existingListeners,
			_globalListeners: existingGlobals,
			lastHit: { pressed: false, ms: 0, absMs: 0, judgment: null, score: 0 },
			subscribeEvents: function (callback) {
				this._globalListeners.push(callback);
			},
			event: function (eventName, callback) {
				if (!this._listeners[eventName]) this._listeners[eventName] = [];
				this._listeners[eventName].push(callback);
			},
			emit: function (eventName, data) {
				if (this._listeners[eventName]) {
					this._listeners[eventName].forEach((cb) => cb(data));
				}
				this._globalListeners.forEach((cb) => cb(eventName, data));
			},
			get: {
				all: () => self.manager.notes,
				byLane: (laneIndex, isPlayer) =>
					self.manager.notes.filter((n) => n.lane === laneIndex && n.isPlayer === isPlayer && n.active),
				upcoming: (isPlayer = true, timeWindowMs = 1500) => {
					if (!funkin.conductor) return [];
					const currentPos = funkin.conductor.songPosition;
					return self.manager.notes.filter(
						(n) =>
							n.isPlayer === isPlayer &&
							n.active &&
							n.noteTime >= currentPos &&
							n.noteTime <= currentPos + timeWindowMs
					);
				},
			},
		};

		funkin.playNotes.event("inject_note", (noteData) => this.manager.skin.injectNote(noteData));
	}

	destroy() {
		if (funkin.playNotes) {
			funkin.playNotes._listeners = {};
			funkin.playNotes._globalListeners = [];
		}
	}
}
funkin.play.visuals.arrows.notes.NoteAPI = NoteAPI;