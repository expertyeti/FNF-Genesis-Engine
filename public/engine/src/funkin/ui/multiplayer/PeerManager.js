/**
 * @file PeerManager.js
 * Manejador centralizado para conexiones P2P con sincronización.
 */
class PeerManager {
    constructor() {
        this.peer = null;
        this.connection = null;
        this.localId = null;
        this.remotePeerId = null;
        this.isInitiator = false; // true si iniciamos la conexión
        
        // Callbacks generales
        this.onConnected = null;
        this.onDisconnected = null;
        this.onError = null;
        
        // Callbacks específicos por tipo de mensaje
        this.messageHandlers = {
            'handshake': null,
            'load_complete': null,
            'game_sync': null,
            'music_sync': null,
            'custom': null
        };
        
        this.isReady = false;
        this.messageQueue = [];
    }

    init() {
        return new Promise((resolve, reject) => {
            const randomId = Math.random().toString(36).substring(2, 7).toUpperCase();
            this.localId = randomId;
            this.peer = new Peer(randomId);

            this.peer.on('open', (id) => {
                console.log(`[PeerManager] Peer abierto con ID: ${id}`);
                resolve(id);
            });
            
            this.peer.on('connection', (conn) => {
                console.log(`[PeerManager] Conexión entrante de: ${conn.peer}`);
                this.isInitiator = false; // Nosotros no iniciamos
                this.setupConnection(conn);
            });
            
            this.peer.on('error', (err) => {
                console.error(`[PeerManager] Error:`, err);
                if (this.onError) this.onError(err);
                reject(err);
            });
        });
    }

    connectTo(targetId) {
        if (!this.peer) {
            console.error('[PeerManager] Peer no inicializado');
            return;
        }
        console.log(`[PeerManager] Conectando a: ${targetId}`);
        this.isInitiator = true; // Nosotros iniciamos
        const conn = this.peer.connect(targetId.toUpperCase());
        this.setupConnection(conn);
    }

    setupConnection(conn) {
        this.connection = conn;
        this.remotePeerId = conn.peer;
        
        this.connection.on('open', () => {
            this.isReady = true;
            console.log(`[PeerManager] Conexión establecida con: ${this.remotePeerId}`);
            
            // Procesar cola de mensajes pendientes
            this._processMessageQueue();
            
            if (this.onConnected) {
                this.onConnected(this.remotePeerId);
            }
        });
        
        this.connection.on('data', (data) => {
            this._handleMessage(data);
        });
        
        this.connection.on('close', () => {
            this.isReady = false;
            console.log(`[PeerManager] Conexión cerrada`);
            if (this.onDisconnected) {
                this.onDisconnected();
            }
        });
        
        this.connection.on('error', (err) => {
            console.error(`[PeerManager] Error de conexión:`, err);
            if (this.onError) this.onError(err);
        });
    }

    /**
     * Maneja mensajes entrantes y los enruta al handler correcto
     */
    _handleMessage(data) {
        try {
            // Si es un objeto con type, es un mensaje estructurado
            if (typeof data === 'object' && data.type) {
                const { type, payload } = data;
                console.log(`[PeerManager] Mensaje recibido: ${type}`, payload);
                
                if (this.messageHandlers[type] && typeof this.messageHandlers[type] === 'function') {
                    this.messageHandlers[type](payload);
                }
                
                // Callback universal si existe
                if (this.messageHandlers['custom']) {
                    this.messageHandlers['custom'](type, payload);
                }
            } else if (typeof data === 'object' && data.actuallyPlaying) {
                // Compatibilidad con datos legacy (inyección PlayDataPayload)
                this.messageHandlers['game_sync']?.(data);
            }
        } catch (err) {
            console.error(`[PeerManager] Error procesando mensaje:`, err);
        }
    }

    /**
     * Procesa mensajes en cola si llegaron antes de que la conexión se abriera
     */
    _processMessageQueue() {
        while (this.messageQueue.length > 0) {
            const msg = this.messageQueue.shift();
            this.sendData(msg);
        }
    }

    /**
     * Envía un mensaje estructurado
     */
    sendMessage(type, payload = {}) {
        const message = { type, payload };
        this.sendData(message);
    }

    /**
     * Envía datos (compatible con ambos formatos)
     */
    sendData(data) {
        if (!this.connection) {
            console.warn('[PeerManager] Conexión no disponible, encolando mensaje');
            this.messageQueue.push(data);
            return;
        }
        
        if (this.connection.open) {
            console.log(`[PeerManager] Enviando:`, data);
            this.connection.send(data);
        } else {
            console.warn('[PeerManager] Conexión cerrada, encolando mensaje');
            this.messageQueue.push(data);
        }
    }

    /**
     * Registra un handler para un tipo específico de mensaje
     */
    onMessage(type, callback) {
        if (this.messageHandlers.hasOwnProperty(type)) {
            this.messageHandlers[type] = callback;
        } else {
            console.warn(`[PeerManager] Tipo de mensaje desconocido: ${type}`);
        }
    }

    /**
     * Obtiene la información del rol en multijugador
     */
    getMultiplayerRole() {
        return this.isInitiator ? 'p1' : 'p2';
    }

    destroy() {
        if (this.connection) this.connection.close();
        if (this.peer) this.peer.destroy();
        this.isReady = false;
        this.messageQueue = [];
    }
}

window.funkin = window.funkin || {};
window.funkin.multiplayer = window.funkin.multiplayer || {};
window.funkin.multiplayer.PeerManager = new PeerManager();