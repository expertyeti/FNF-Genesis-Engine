/**
 * @file src/funkin/play/visuals/arrows/strumelines/strumelinesAPI.js
 * API global para manipular las strumlines en tiempo real (modding/eventos).
 */

class StrumlinesAPI {
    /**
     * Inicializa la interfaz de programación (API) global de las Strumlines.
     * @param {Object} strumlinesInstance - La instancia de la clase Strumlines.
     */
    static init(strumlinesInstance) {
        const self = strumlinesInstance;
        
        window.strumelines = {
            _listeners: {},
            _globalListeners: [],

            subscribeEvents: function(callback) { this._globalListeners.push(callback); },
            event: function(eventName, callback) {
                if (!this._listeners[eventName]) this._listeners[eventName] = [];
                this._listeners[eventName].push(callback);
            },
            emit: function(eventName, data) {
                if (this._listeners[eventName]) this._listeners[eventName].forEach(cb => cb(data));
                this._globalListeners.forEach(cb => cb(eventName, data));
            },
            
            player: {
                pos: {
                    get: () => {
                        if (!self.playerStrums || !self.playerStrums[0]) return [0, 0];
                        return [self.playerStrums[0].baseX, self.playerStrums[0].baseY];
                    },
                    set: (val) => {
                        if (!Array.isArray(val) || val.length < 2 || !self.playerStrums || !self.playerStrums[0]) return;
                        const dx = val[0] - self.playerStrums[0].baseX;
                        const dy = val[1] - self.playerStrums[0].baseY;
                        self.playerStrums.forEach(arrow => {
                            arrow.baseX += dx;
                            arrow.baseY += dy;
                            arrow.playAnim(arrow.currentAction || 'static', true); 
                        });
                    }
                }
            },
            enemy: {
                pos: {
                    get: () => {
                        if (!self.opponentStrums || !self.opponentStrums[0]) return [0, 0];
                        return [self.opponentStrums[0].baseX, self.opponentStrums[0].baseY];
                    },
                    set: (val) => {
                        if (!Array.isArray(val) || val.length < 2 || !self.opponentStrums || !self.opponentStrums[0]) return;
                        const dx = val[0] - self.opponentStrums[0].baseX;
                        const dy = val[1] - self.opponentStrums[0].baseY;
                        self.opponentStrums.forEach(arrow => {
                            arrow.baseX += dx;
                            arrow.baseY += dy;
                            arrow.playAnim(arrow.currentAction || 'static', true);
                        });
                    }
                }
            },
            directions: {
                player: {
                    pos: {
                        get: (dir) => {
                            const idx = self.getDirIndex(dir);
                            if (!self.playerStrums || !self.playerStrums[idx]) return [0, 0];
                            return [self.playerStrums[idx].baseX, self.playerStrums[idx].baseY];
                        },
                        set: (dir, val) => {
                            if (!Array.isArray(val) || val.length < 2) return;
                            const idx = self.getDirIndex(dir);
                            if (!self.playerStrums || !self.playerStrums[idx]) return;
                            self.playerStrums[idx].baseX = val[0];
                            self.playerStrums[idx].baseY = val[1];
                            self.playerStrums[idx].playAnim(self.playerStrums[idx].currentAction || 'static', true);
                        }
                    }
                },
                enemy: {
                    pos: {
                        get: (dir) => {
                            const idx = self.getDirIndex(dir);
                            if (!self.opponentStrums || !self.opponentStrums[idx]) return [0, 0];
                            return [self.opponentStrums[idx].baseX, self.opponentStrums[idx].baseY];
                        },
                        set: (dir, val) => {
                            if (!Array.isArray(val) || val.length < 2) return;
                            const idx = self.getDirIndex(dir);
                            if (!self.opponentStrums || !self.opponentStrums[idx]) return;
                            self.opponentStrums[idx].baseX = val[0];
                            self.opponentStrums[idx].baseY = val[1];
                            self.opponentStrums[idx].playAnim(self.opponentStrums[idx].currentAction || 'static', true);
                        }
                    }
                }
            }
        };
    }
}

if (typeof window !== 'undefined') funkin.StrumlinesAPI = StrumlinesAPI;