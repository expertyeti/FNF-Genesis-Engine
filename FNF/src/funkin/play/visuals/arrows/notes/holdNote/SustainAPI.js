/**
 * Gestiona el sistema de eventos de notas largas.
 */
class SustainAPI {
	constructor(manager) {
		this.manager = manager;
	}

	init() {
		funkin.playSustains = {
			_listeners: {},
			event: function (eventName, callback) {
				if (!this._listeners[eventName]) this._listeners[eventName] = [];
				this._listeners[eventName].push(callback);
			},
			emit: function (eventName, data) {
				if (this._listeners[eventName]) {
					this._listeners[eventName].forEach((cb) => cb(data));
				}
			},
		};
	}

	destroy() {
		if (funkin.playSustains) funkin.playSustains._listeners = {};
	}
}

if (typeof window !== "undefined") funkin.SustainAPI = SustainAPI;