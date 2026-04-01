/**
 * Orquestador principal de controles (Físicos y Virtuales).
 * Archivo: src/utils/controls.js
 */

class ControlsManager {
  constructor() {
    this.keyBinds = {
      UI_UP: [38, 87],
      UI_DOWN: [40, 83],
      UI_LEFT: [37, 65],
      UI_RIGHT: [39, 68],

      NOTE_UP: [38, 87],
      NOTE_DOWN: [40, 83],
      NOTE_LEFT: [37, 65],
      NOTE_RIGHT: [39, 68],

      ACCEPT: [13, 32, 90],
      BACK: [27, 8, 88],
      PAUSE: [13, 27, 80],
      DEBUGG: [55, 103],

      VOL_UP: [187, 107],
      VOL_DOWN: [189, 109],
      VOL_MUTE: [48, 96],

      // Nueva acción para F3 (código 114)
      DEV_TOOLS: [114], 
    };

    this.gamepadBinds = {
      UI_UP: [12],
      UI_DOWN: [13],
      UI_LEFT: [14],
      UI_RIGHT: [15],

      NOTE_UP: [12, 3],
      NOTE_DOWN: [13, 0],
      NOTE_LEFT: [14, 2],
      NOTE_RIGHT: [15, 1],

      ACCEPT: [0, 9],
      BACK: [1],
      PAUSE: [9],
      DEBUGG: [],

      VOL_UP: [],
      VOL_DOWN: [],
      VOL_MUTE: [],
      
      DEV_TOOLS: [],
    };

    this.physicalKeys = {};
    this.physicalButtons = {};
    this.virtualKeys = {};

    this.state = {};
    this.previousState = {};

    this.actions = Object.keys(this.keyBinds);

    this._setupListeners();
    this._setupGetters();
  }

  _setupListeners() {
    if (typeof window === "undefined") return;

    window.addEventListener("keydown", (e) => {
      // Prevenir el comportamiento por defecto de Ctrl + W y Ctrl + D en el navegador
      if (e.ctrlKey && (e.key.toLowerCase() === 'w' || e.key.toLowerCase() === 'd')) {
        e.preventDefault();
      }

      // Prevenir comportamiento de F3 por defecto
      if (e.keyCode === 114) {
        e.preventDefault();
      }

      this.physicalKeys[e.keyCode] = true;
      if ([32, 37, 38, 39, 40, 114].indexOf(e.keyCode) > -1) {
        e.preventDefault();
      }
    });

    window.addEventListener("keyup", (e) => {
      this.physicalKeys[e.keyCode] = false;
    });
  }

  _pollGamepads() {
    if (typeof navigator === "undefined") return;

    this.physicalButtons = {};
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (let i = 0; i < gamepads.length; i++) {
      let gp = gamepads[i];
      if (gp) {
        for (let b = 0; b < gp.buttons.length; b++) {
          if (gp.buttons[b].pressed) {
            this.physicalButtons[b] = true;
          }
        }
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

    let keys = this.keyBinds[action];
    if (keys) {
      for (let i = 0; i < keys.length; i++) {
        if (this.physicalKeys[keys[i]]) return true;
      }
    }

    let buttons = this.gamepadBinds[action];
    if (buttons) {
      for (let i = 0; i < buttons.length; i++) {
        if (this.physicalButtons[buttons[i]]) return true;
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
    if (action === "BACK" && funkin.MobileBackButton) {
      funkin.MobileBackButton.checkAndInject(this);
    } else if (
      ["NOTE_LEFT", "NOTE_DOWN", "NOTE_UP", "NOTE_RIGHT"].includes(action) &&
      window.MobileHitbox
    ) {
      window.MobileHitbox.checkAndInject(this);
    }
  }
}

funkin.controls = new ControlsManager();