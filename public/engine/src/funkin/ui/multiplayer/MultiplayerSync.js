/**
 * @file MultiplayerSync.js
 * Gestor centralizado de sincronización para multijugador.
 * Maneja handshakes, espera de carga y sincronización de música.
 */

window.funkin = window.funkin || {};
window.funkin.multiplayer = window.funkin.multiplayer || {};

class MultiplayerSync {
    constructor() {
        this.isMultiplayer = false;
        this.localRole = null; // 'p1' o 'p2'
        this.remoteRole = null;
        this.peerManager = null; // Lazy-loaded
        
        // Estado de carga
        this.localReady = false;
        this.remoteReady = false;
        this.syncToken = null;
        
        // Callbacks
        this.onBothReady = null;
        this.onMusicSync = null;
        this.onRemoteLoadComplete = null;
        
        // Timestamps para sincronización de música
        this.musicStartTime = null;
        this.localMusicStartTime = null;
        
        this._setupListeners();
    }

    /**
     * Obtiene PeerManager de forma lazy-loaded
     */
    _getPeerManager() {
        if (!this.peerManager) {
            if (!window.funkin?.multiplayer?.PeerManager) {
                console.error('[MultiplayerSync] PeerManager no está disponible');
                return null;
            }
            this.peerManager = window.funkin.multiplayer.PeerManager;
        }
        return this.peerManager;
    }

    /**
     * Inicia el sistema de sincronización
     */
    init(isMultiplayer, localRole) {
        this.isMultiplayer = isMultiplayer;
        this.localRole = localRole;
        this.remoteRole = localRole === 'p1' ? 'p2' : 'p1';
        
        console.log(`[MultiplayerSync] Inicializado. Rol: ${this.localRole}, Multijugador: ${this.isMultiplayer}`);
        
        if (this.isMultiplayer) {
            this._setupMultiplayerHandlers();
        }
    }

    /**
     * Configura los handlers de mensajes del PeerManager
     */
    _setupMultiplayerHandlers() {
        const peerManager = this._getPeerManager();
        if (!peerManager) return;
        
        // Handshake inicial
        peerManager.onMessage('handshake', (payload) => {
            console.log(`[MultiplayerSync] Handshake recibido:`, payload);
            this.remoteRole = payload.role;
            this.syncToken = payload.token;
        });
        
        // El otro jugador completó la carga
        peerManager.onMessage('load_complete', (payload) => {
            console.log(`[MultiplayerSync] ${this.remoteRole} completó carga`);
            this.remoteReady = true;
            if (this.onRemoteLoadComplete) {
                this.onRemoteLoadComplete();
            }
            this._checkBothReady();
        });
        
        // Sincronización de música
        peerManager.onMessage('music_sync', (payload) => {
            console.log(`[MultiplayerSync] Sincronización de música recibida:`, payload);
            this.musicStartTime = payload.startTime;
            if (this.onMusicSync) {
                this.onMusicSync(payload);
            }
        });
    }

    /**
     * Configura listeners básicos del PeerManager
     */
    _setupListeners() {
        // Defer until PeerManager is ready
        const checkPeerManager = setInterval(() => {
            const peerManager = this._getPeerManager();
            if (peerManager) {
                clearInterval(checkPeerManager);
                
                const originalOnConnected = peerManager.onConnected;
                peerManager.onConnected = (remotePeerId) => {
                    console.log(`[MultiplayerSync] Conectado con: ${remotePeerId}`);
                    
                    // Enviar handshake
                    this.sendHandshake();
                    
                    if (originalOnConnected) {
                        originalOnConnected(remotePeerId);
                    }
                };
            }
        }, 100);
    }

    /**
     * Envía handshake inicial al conectar
     */
    sendHandshake() {
        const peerManager = this._getPeerManager();
        if (!peerManager) {
            console.warn('[MultiplayerSync] PeerManager no disponible para handshake');
            return;
        }
        
        const handshakeData = {
            role: this.localRole,
            token: Math.random().toString(36).substring(7),
            timestamp: Date.now()
        };
        
        peerManager.sendMessage('handshake', handshakeData);
        console.log(`[MultiplayerSync] Handshake enviado como ${this.localRole}`);
    }

    /**
     * Notifica que este jugador completó la carga
     */
    notifyLoadComplete(gameData = {}) {
        if (!this.isMultiplayer) return;
        
        const peerManager = this._getPeerManager();
        if (!peerManager) {
            console.warn('[MultiplayerSync] PeerManager no disponible para notifyLoadComplete');
            return;
        }
        
        this.localReady = true;
        console.log(`[MultiplayerSync] ${this.localRole} notificando carga completa`);
        
        peerManager.sendMessage('load_complete', {
            role: this.localRole,
            timestamp: Date.now(),
            gameData: gameData
        });
        
        this._checkBothReady();
    }

    /**
     * Verifica si ambos jugadores están listos
     */
    _checkBothReady() {
        if (this.localReady && this.remoteReady && this.onBothReady) {
            console.log(`[MultiplayerSync] ¡Ambos jugadores listos!`);
            this.onBothReady();
        }
    }

    /**
     * Inicia la sincronización de música
     */
    initMusicSync() {
        if (!this.isMultiplayer) return;
        
        const peerManager = this._getPeerManager();
        if (!peerManager) {
            console.warn('[MultiplayerSync] PeerManager no disponible para initMusicSync');
            return;
        }
        
        // P1 (host) decide el tiempo de inicio
        if (this.localRole === 'p1') {
            this.musicStartTime = Date.now() + 500; // 500ms de delay para que P2 reciba el mensaje
            
            peerManager.sendMessage('music_sync', {
                startTime: this.musicStartTime,
                role: this.localRole,
                timestamp: Date.now()
            });
            
            console.log(`[MultiplayerSync] P1 enviando sincronización de música`);
        }
    }

    /**
     * Obtiene el offset de sincronización de música
     */
    getMusicOffset() {
        if (!this.isMultiplayer || !this.musicStartTime) {
            return 0;
        }
        
        const now = Date.now();
        const offset = this.musicStartTime - now;
        return Math.max(0, offset);
    }

    /**
     * Espera a que ambos jugadores estén listos
     */
    waitForBothReady() {
        return new Promise((resolve) => {
            if (this.localReady && this.remoteReady) {
                resolve();
            } else {
                this.onBothReady = resolve;
            }
        });
    }

    /**
     * Limpia recursos
     */
    destroy() {
        this.isMultiplayer = false;
        this.localReady = false;
        this.remoteReady = false;
        this.onBothReady = null;
        this.onMusicSync = null;
        this.onRemoteLoadComplete = null;
    }
}

window.funkin.multiplayer.MultiplayerSync = new MultiplayerSync();
