/**
 * @file src/utils/controls/controls.js
 */
window.funkin = window.funkin || {};

class ControlsManager {
  constructor() {
    this.originalKeyBinds = {
      UI_UP: [38, 87],
      UI_DOWN: [40, 83],
      UI_LEFT: [37, 65],
      UI_RIGHT: [39, 68],
      NOTE_UP: [38, 87],
      NOTE_DOWN: [40, 83],
      NOTE_LEFT: [37, 65],
      NOTE_RIGHT: [39, 68],
      P2_NOTE_UP: [87, 38],
      P2_NOTE_DOWN: [83, 40],
      P2_NOTE_LEFT: [65, 37],
      P2_NOTE_RIGHT: [68, 39],
      ACCEPT: [13, 32, 90],
      BACK: [27, 8, 88],
      PAUSE: [13, 27, 80],
      DEBUGG: [55, 103],
      VOL_UP: [187, 107],
      VOL_DOWN: [189, 109],
      VOL_MUTE: [48, 96],
      DEV_TOOLS: [114],
    };

    this.originalGamepadBinds = {
      UI_UP: [12],
      UI_DOWN: [13],
      UI_LEFT: [14],
      UI_RIGHT: [15],
      NOTE_UP: [12, 3],     // D-PAD UP, Y/Triangle
      NOTE_DOWN: [13, 0],   // D-PAD DOWN, A/Cross
      NOTE_LEFT: [14, 2],   // D-PAD LEFT, X/Square
      NOTE_RIGHT: [15, 1],  // D-PAD RIGHT, B/Circle
      P2_NOTE_UP: [12, 3],
      P2_NOTE_DOWN: [13, 0],
      P2_NOTE_LEFT: [14, 2],
      P2_NOTE_RIGHT: [15, 1],
      ACCEPT: [0, 9],
      BACK: [1],
      PAUSE: [9],
      DEBUGG: [],
      VOL_UP: [],
      VOL_DOWN: [],
      VOL_MUTE: [],
      DEV_TOOLS: [],
    };

    this.keyBinds = JSON.parse(JSON.stringify(this.originalKeyBinds));
    this.gamepadBinds = JSON.parse(JSON.stringify(this.originalGamepadBinds));

    this.physicalKeys = {};
    this.physicalButtons = {};
    this.gamepadSpecific = {}; // Para guardar inputs por cada mando individualmente
    this.connectedGamepads = 0;
    this.virtualKeys = {};
    this.state = {};
    this.previousState = {};
    this.actions = Object.keys(this.keyBinds);
    this.isTwoPlayerSplit = false;

    this._setupListeners();
    this._setupGetters();
  }

  // ALGORITMO INTELIGENTE DE DIVISIÓN DE CONTROLES (2P)
  applyTwoPlayerSplit() {
    this.isTwoPlayerSplit = true;
    const dirs = ["UP", "DOWN", "LEFT", "RIGHT"];

    dirs.forEach((dir) => {
      let p1Keys = [...this.originalKeyBinds["NOTE_" + dir]];
      let p2Keys = [...this.originalKeyBinds["P2_NOTE_" + dir]];

      if (p1Keys.length > 1 && p2Keys.length > 1) {
        // CORRECCION APLICADA:
        // P1 (Jugador / Lado Derecho) asume las Flechas (índice 0 en la conf. base de NOTE_)
        // P2 (Oponente / Lado Izquierdo) asume WASD (índice 0 en la conf. base de P2_NOTE_)
        this.keyBinds["NOTE_" + dir] = [p1Keys[0]]; 
        this.keyBinds["P2_NOTE_" + dir] = [p2Keys[0]]; 
      }
    });
  }

  restoreBinds() {
    this.isTwoPlayerSplit = false;
    this.keyBinds = JSON.parse(JSON.stringify(this.originalKeyBinds));
    this.gamepadBinds = JSON.parse(JSON.stringify(this.originalGamepadBinds));
  }

  _setupListeners() {
    if (typeof window === "undefined") return;

    window.addEventListener("keydown", (e) => {
      if (
        e.ctrlKey &&
        (e.key.toLowerCase() === "w" || e.key.toLowerCase() === "d")
      )
        e.preventDefault();
      if (e.keyCode === 114) e.preventDefault();

      this.physicalKeys[e.keyCode] = true;
      if ([32, 37, 38, 39, 40, 114].indexOf(e.keyCode) > -1) e.preventDefault();
    });

    window.addEventListener("keyup", (e) => {
      this.physicalKeys[e.keyCode] = false;
    });
  }

  _pollGamepads() {
    if (typeof navigator === "undefined") return;

    this.physicalButtons = {};
    this.gamepadSpecific = { 0: {}, 1: {}, 2: {}, 3: {} };
    this.connectedGamepads = 0;
    
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    
    // Contar mandos conectados reales
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i] && gamepads[i].connected) {
         this.connectedGamepads++;
      }
    }

    // Leer botones y separarlos por jugador (Virtual ID)
    let virtualGpId = 0;
    for (let i = 0; i < gamepads.length; i++) {
      let gp = gamepads[i];
      if (gp && gp.connected) {
        for (let b = 0; b < gp.buttons.length; b++) {
          if (gp.buttons[b].pressed) {
            this.physicalButtons[b] = true; // Variable Global (Cualquier mando)
            if (this.gamepadSpecific[virtualGpId]) {
                this.gamepadSpecific[virtualGpId][b] = true; // Variable Individual
            }
          }
        }
        virtualGpId++; // El primer mando conectado será P1(0), el segundo P2(1)
      }
    }
  }

  simulatePress(action) {
    this.virtualKeys[action] = true;
  }
  simulateRelease(action) {
    this.virtualKeys[action] = false;
  }

  update() {
    for (let action of this.actions) {
      this.previousState[action] = this.state[action] || false;
    }
    this._pollGamepads();
    for (let action of this.actions) {
      this.state[action] = this._checkAction(action);
    }
  }

  _checkAction(action) {
    if (this.virtualKeys[action]) return true;

    // Comprobar Teclado
    let keys = this.keyBinds[action];
    if (keys) {
      for (let i = 0; i < keys.length; i++) {
        if (this.physicalKeys[keys[i]]) return true;
      }
    }

    // Comprobar Gamepads
    let buttons = this.gamepadBinds[action];
    if (buttons) {
        if (this.isTwoPlayerSplit) {
            if (this.connectedGamepads >= 2) {
                // MODO 2 MANDOS: Cada jugador tiene su propio mando
                let gpIndex = -1;
                if (action.startsWith("P2_NOTE_")) gpIndex = 1; // Acciones P2 -> Mando 2
                else if (action.startsWith("NOTE_")) gpIndex = 0; // Acciones P1 -> Mando 1
                
                if (gpIndex !== -1) {
                    // Rutear la acción estrictamente a su mando asignado
                    for (let i = 0; i < buttons.length; i++) {
                        if (this.gamepadSpecific[gpIndex] && this.gamepadSpecific[gpIndex][buttons[i]]) return true;
                    }
                } else {
                    // Acciones Generales (Pausar, Aceptar, Menús): Cualquier mando sirve
                    for (let i = 0; i < buttons.length; i++) {
                        if (this.physicalButtons[buttons[i]]) return true;
                    }
                }
            } else {
                // MODO 1 MANDO COMPARTIDO: 
                let isP1 = action.startsWith("NOTE_");
                let isP2 = action.startsWith("P2_NOTE_");
                
                if (isP1 && buttons.length > 0) {
                    // P1 (Principal) asume el lado izquierdo del mando: D-PAD
                    if (this.physicalButtons[buttons[0]]) return true; 
                } else if (isP2 && buttons.length > 1) {
                    // P2 asume el lado derecho del mando: A/B/X/Y
                    if (this.physicalButtons[buttons[1]]) return true; 
                } else {
                    for (let i = 0; i < buttons.length; i++) {
                        if (this.physicalButtons[buttons[i]]) return true;
                    }
                }
            }
        } else {
            // Modo Un Jugador (Vanilla): Responde normal a cualquier configuración
            for (let i = 0; i < buttons.length; i++) {
                if (this.physicalButtons[buttons[i]]) return true;
            }
        }
    }

    return false;
  }

  _setupGetters() {
    for (let action of this.actions) {
      Object.defineProperty(this, action, {
        get: () => {
          this._checkMobileModules(action);
          return this.state[action];
        },
      });
      Object.defineProperty(this, action + "_P", {
        get: () => {
          this._checkMobileModules(action);
          return this.state[action] && !this.previousState[action];
        },
      });
      Object.defineProperty(this, action + "_R", {
        get: () => {
          this._checkMobileModules(action);
          return !this.state[action] && this.previousState[action];
        },
      });
    }
  }

  _checkMobileModules(action) {
    if (
      action === "BACK" &&
      window.funkin &&
      funkin.utils &&
      funkin.utils.MobileBackButton
    ) {
      funkin.utils.MobileBackButton.checkAndInject(this);
    } else if (
      action === "PAUSE" &&
      window.funkin &&
      funkin.utils &&
      funkin.utils.MobilePauseBtn
    ) {
      funkin.utils.MobilePauseBtn.checkAndInject(this);
    } else if (
      [
        "NOTE_LEFT",
        "NOTE_DOWN",
        "NOTE_UP",
        "NOTE_RIGHT",
        "P2_NOTE_LEFT",
        "P2_NOTE_DOWN",
        "P2_NOTE_UP",
        "P2_NOTE_RIGHT",
      ].includes(action) &&
      window.funkin &&
      funkin.utils &&
      funkin.utils.MobileHitbox
    ) {
      funkin.utils.MobileHitbox.checkAndInject(this);
    }
  }
}

funkin.controls = new ControlsManager();