/**
 * @file MultiplayerScene.js
 * Escena de conexión multijugador para Genesis Engine.
 * Maneja la conexión P2P y el handshake inicial antes de pasar a PlayScene.
 */
class MultiplayerScene extends Phaser.Scene {
    constructor() {
        super({ key: "MultiplayerScene" });
        this.peerManager = window.funkin.multiplayer.PeerManager;
        this.multiplayerSync = window.funkin.multiplayer.MultiplayerSync;
        this.localId = "";
        this.localRole = null; // 'p1' o 'p2'
        this.selectedSong = "bopeebo"; // Canción predeterminada
        this.selectedDifficulty = "normal"; // Dificultad predeterminada
    }

    create() {
        const { width, height } = this.scale;

        this.cameras.main.setBackgroundColor('#000000');

        this.titleText = this.add.text(width / 2, height * 0.15, 'MULTIPLAYER', {
            fontFamily: 'vcr',
            fontSize: '48px',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        this.statusText = this.add.text(width / 2, height * 0.25, 'Iniciando servidor local...', {
            fontFamily: 'vcr',
            fontSize: '24px',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        this.codeText = this.add.text(width / 2, height * 0.4, 'TU CODIGO: ---', {
            fontFamily: 'vcr',
            fontSize: '40px',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        this.createInputBox(width, height);
        this.createConnectButton(width, height);
        this.createBackButton(width, height);

        this.setupPeer();
    }

    /**
     * Inicializa la red y maneja los callbacks.
     */
    async setupPeer() {
        try {
            this.localId = await this.peerManager.init();
            this.codeText.setText(`TU CODIGO: ${this.localId}`);
            this.statusText.setText('Esperando oponente...');

            // P1 = quien crea la sala (el que NO introduce código, solo espera)
            // P2 = quien se conecta a la sala (el que introduce código y se conecta)
            this.localRole = 'p1'; // Por defecto somos P1

            this.peerManager.onConnected = (peerId) => {
                console.log(`[MultiplayerScene] Conectado con P2: ${peerId}`);
                
                // El PeerManager ya determinó el rol basado en isInitiator
                this.localRole = this.peerManager.getMultiplayerRole();
                
                this.statusText.setText(`Conectado. Tu rol: ${this.localRole === 'p1' ? 'Host (P1)' : 'Invitado (P2)'}`);
                
                // Inicializar MultiplayerSync
                this.multiplayerSync.init(true, this.localRole);
                
                // Inyectar datos para PlayScene
                window.funkin.PlayDataPayload = {
                    sourceScene: "MultiplayerScene",
                    actuallyPlaying: this.selectedSong,
                    difficulty: this.selectedDifficulty,
                    inMultiplayer: true,
                    localPlayerRole: this.localRole, // p1 o p2
                    remotePeerId: peerId
                };

                // Esperar handshake y luego ir a PlayScene
                this.time.delayedCall(1500, () => {
                    this.scene.start('PlayScene', window.funkin.PlayDataPayload);
                });
            };

            this.peerManager.onError = (err) => {
                console.error(`[MultiplayerScene] Error:`, err);
                this.statusText.setText(`Error: ${err.type}`);
            };

        } catch (error) {
            console.error(`[MultiplayerScene] Error al conectar:`, error);
            this.statusText.setText('Error al conectar a la red P2P.');
        }
    }

    /**
     * Crea un input HTML sobre el canvas para escribir el código del oponente.
     */
    createInputBox(width, height) {
        this.add.text(width / 2, height * 0.55, 'INTRODUCIR CODIGO:', {
            fontFamily: 'vcr',
            fontSize: '24px',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        const inputStyle = `
            width: 300px;
            height: 50px;
            font-family: vcr, sans-serif;
            font-size: 32px;
            text-align: center;
            text-transform: uppercase;
            background-color: #000000;
            color: #FFFFFF;
            border: 2px solid #FFFFFF;
            border-radius: 8px;
            outline: none;
        `;

        this.htmlInput = this.add.dom(width / 2, height * 0.65).createFromHTML(`
            <input type="text" id="peerInput" maxlength="5" style="${inputStyle}" autocomplete="off">
        `);
    }

    /**
     * Crea el botón interactivo para iniciar la conexión.
     */
    createConnectButton(width, height) {
        this.connectBtn = this.add.text(width / 2, height * 0.8, '[ CONECTAR ]', {
            fontFamily: 'vcr',
            fontSize: '36px',
            color: '#FFFFFF'
        }).setOrigin(0.5).setInteractive();

        this.connectBtn.on('pointerover', () => {
            this.connectBtn.setColor('#000000');
            this.connectBtn.setBackgroundColor('#FFFFFF');
        });

        this.connectBtn.on('pointerout', () => {
            this.connectBtn.setColor('#FFFFFF');
            this.connectBtn.setBackgroundColor('transparent');
        });

        this.connectBtn.on('pointerdown', () => {
            const inputElement = document.getElementById('peerInput');
            if (inputElement && inputElement.value.trim().length > 0) {
                // Cuando el usuario introduce un código y conecta, es P2 (invitado)
                this.localRole = 'p2'; // Cambiar de P1 a P2
                this.statusText.setText('Conectando como invitado (P2)...');
                console.log('[MultiplayerScene] Conectando como P2');
                this.peerManager.connectTo(inputElement.value.trim());
            }
        });
    }

    /**
     * Crea el botón para regresar al menú principal.
     */
    createBackButton(width, height) {
        this.backBtn = this.add.text(50, 50, '< VOLVER', {
            fontFamily: 'vcr',
            fontSize: '24px',
            color: '#FFFFFF'
        }).setInteractive();

        this.backBtn.on('pointerdown', () => {
            this.peerManager.destroy();
            this.scene.start('MainMenuScene');
        });
    }

    shutdown() {
        if (this.htmlInput) {
            this.htmlInput.destroy();
        }
    }
}

window.game.scene.add("MultiplayerScene", MultiplayerScene);