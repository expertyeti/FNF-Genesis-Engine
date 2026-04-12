// src/core/namespaces.js
/**
 * Global map of variables and architectural branches for Genesis Engine.
 */

window.funkin = window.funkin || {};

funkin.core = funkin.core || {};
funkin.utils = funkin.utils || {};
funkin.ui = funkin.ui || {};

funkin.utils.animations = funkin.utils.animations || {};
funkin.utils.animations.sparrow = funkin.utils.animations.sparrow || {};
funkin.utils.mobile = funkin.utils.mobile || {};
funkin.utils.soundtray = funkin.utils.soundtray || {};

// NUEVO: Mapas de debugging para song.js, stage, mode, etc.
funkin.utils.debugging = funkin.utils.debugging || {};
funkin.utils.debugging.play = funkin.utils.debugging.play || {};
funkin.utils.debugging.play.song = funkin.utils.debugging.play.song || {};
funkin.utils.debugging.play.stage = funkin.utils.debugging.play.stage || {};

funkin.utils.controls = funkin.utils.controls || {};
funkin.utils.controls.cursors = funkin.utils.controls.cursors || {};

funkin.utils.MobileBackButton = null;
funkin.utils.MobilePauseBtn = null;

funkin.ui.loading = funkin.ui.loading || {};
funkin.ui.intro = funkin.ui.intro || {};
funkin.ui.mainMenu = funkin.ui.mainMenu || {};
funkin.ui.storyMode = funkin.ui.storyMode || {};
funkin.ui.freeplay = funkin.ui.freeplay || {};

funkin.play = funkin.play || {};

funkin.play.data = funkin.play.data || {};
funkin.play.data.camera = funkin.play.data.camera || {};
funkin.play.data.song = funkin.play.data.song || {};
funkin.play.data.sources = funkin.play.data.sources || {};
funkin.play.data.clean = funkin.play.data.clean || {};
funkin.play.data.referee = funkin.play.data.referee || {};

funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.stage = funkin.play.visuals.stage || {};
funkin.play.visuals.skins = funkin.play.visuals.skins || {};
funkin.play.visuals.characters = funkin.play.visuals.characters || {};
funkin.play.visuals.ui = funkin.play.visuals.ui || {};

funkin.play.visuals.arrows = funkin.play.visuals.arrows || {};
funkin.play.visuals.arrows.notes = funkin.play.visuals.arrows.notes || {};
funkin.play.visuals.arrows.strumlines = funkin.play.visuals.arrows.strumlines || {};

funkin.play.input = funkin.play.input || {};
funkin.play.options = funkin.play.options || {};

funkin.ui.loading.isComplete = false;
funkin.ui.loading.percent = 0;
funkin.PlayDataPayload = null;

window.hudEventBus = window.hudEventBus || null;
funkin.conductorEvents = funkin.conductorEvents || null;
funkin.conductor = funkin.conductor || null;

funkin.debugMode = false;
funkin.playDebugging = funkin.playDebugging || { enabled: false };
funkin.ArrowModesDebug = null;
funkin.SongDebugger = null;
funkin.CameraDebugController = null;
funkin.hotReloadManager = null;