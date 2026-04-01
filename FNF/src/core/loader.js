/**
 * @file src/core/loader.js
 * Script encargado de inicializar el entorno y cargar secuencialmente
 * todos los archivos necesarios para el motor.
 */

window.funkin = window.funkin || {};

window.funkin.device = {
  env: "web", // Entorno por defecto

  /**
   * Obtiene el entorno de ejecución actual.
   * @returns {string} Retorna 'neutralino', 'capacitor' o 'web'
   */
  get: function () {
    return this.env;
  },
};

if (
  typeof window.NL_PORT !== "undefined" &&
  typeof window.NL_TOKEN !== "undefined"
) {
  window.funkin.device.env = "neutralino";
  Neutralino.init();
  console.log("Entorno inicializado: Neutralino");
} else if (typeof window.Capacitor !== "undefined") {
  window.funkin.device.env = "capacitor";
  console.log("Entorno inicializado: Capacitor");
} else {
  window.funkin.device.env = "web";
  console.log("Entorno inicializado: Web");
}

const scriptsToLoad = [
  // Core
  "src/core/logger.js",
  "src/utils/display/ScreenPanoramic.js",
  "src/core/phaser/ConfigBuilder.js",
  "src/core/phaser/GameEvents.js",
  "js/native/storage.js",
  "src/core/closeApp.js",
  "src/core/phaser.js",

  // Utilidades
  "src/utils/mobile/mobileOrientation.js",
  "src/utils/conductor.js",
  "src/utils/controls/controls.js",
  "src/utils/mobile/hitbox.js",
  "src/utils/mobile/backButton.js",
  "src/utils/animation/sparrow/SparrowParser.js",
  // Blend Modes Utility
  "src/utils/effects/blendMode.js",
  "src/utils/effects/shaders/CustomBlendFX.js",


  // Debugging
  "src/utils/debugging/hotReload.js",
  "src/utils/debugging/play/camera.js",

  "src/utils/debugging/play/stage/characterPositionDebug.js",
  "src/utils/debugging/play/stage/simpleMode.js",

  "src/utils/debugging/play/song.js",
  "src/utils/debugging/arrows/modes.js",

  // Plugins
  "src/plugins/soundTray/soundTrayVisual.js",
  "src/plugins/soundTray/sountrayLogic.js",
  "src/plugins/development/fps.js",
  "src/plugins/pointerInMobile.js",
  "src/plugins/REXPlugins.js",

  "src/core/GlobalPlugins.js",

  // Efectos
  "src/funkin/effects/flash.js",
  "src/funkin/effects/TransitionScene.js",

  // Alfabeto
  "src/funkin/ui/Intro/Loading/AlphabetData.js",
  "src/funkin/ui/Intro/Loading/Alphabet.js",

  // Intro
  "src/funkin/ui/Intro/IntroText/IntroText.js",
  "src/funkin/ui/Intro/GFDanceState/introDanceEventBus.js",
  "src/funkin/ui/Intro/GFDanceState/introDanceAnims.js",
  "src/funkin/ui/Intro/GFDanceState/IntroDance.js",
  "src/funkin/ui/Intro/GFDanceState/funScript.js",
  "src/funkin/ui/Intro/Loading/Loading.js",

  // Main Menu
  "src/funkin/ui/MainMenu/MainMenuEventBus.js",
  "src/funkin/ui/MainMenu/MainMenuOptions.js",
  "src/funkin/ui/MainMenu/MenuOptionSprite.js",
  "src/funkin/ui/MainMenu/MenuInputHandler.js",
  "src/funkin/ui/MainMenu/MainMenuSelection.js",
  "src/funkin/ui/MainMenu/MainMenuEngineVer.js",
  "src/funkin/ui/MainMenu/MainMenuScene.js",
  "src/funkin/ui/MainMenu/MainMenuBackground.js",

  // Story Menu
  "src/funkin/ui/StoryMenu/StoryModeEventBus.js",
  "src/funkin/ui/StoryMenu/StoryModeData.js",
  "src/funkin/ui/StoryMenu/StoryModeProps.js",
  "src/funkin/ui/StoryMenu/StoryModeTitles.js",
  "src/funkin/ui/StoryMenu/StoryModeTracks.js",
  "src/funkin/ui/StoryMenu/StoryModeInput.js",
  "src/funkin/ui/StoryMenu/StoryModeScene.js",
  "src/funkin/ui/StoryMenu/StoryModeDiff.js",
  "src/funkin/ui/StoryMenu/StoryModeCharacterProps.js",
  "src/funkin/ui/StoryMenu/StoryModeUpBar.js",

  // Freeplay
  "src/funkin/ui/FreePlay/FreePlayScene.js",
  "src/funkin/ui/FreePlay/FreePlayInput.js",
  "src/funkin/ui/FreePlay/FreePlayBG.js",
  "src/funkin/ui/FreePlay/FreePlaySongs.js",
  "src/funkin/ui/FreePlay/FreePlayIcons.js",
  "src/funkin/ui/FreePlay/FreePlayDiff.js",

  // Multiplayer
  "src/funkin/ui/Multiplayer/MultiplayerInput.js",
  "src/funkin/ui/Multiplayer/MultiplayerScene.js",

  // Options
  "src/funkin/ui/Options/OptionsInput.js",
  "src/funkin/ui/Options/OptionsScene.js",

  // Credits
  "src/funkin/ui/Credits/CreditsInput.js",
  "src/funkin/ui/Credits/CreditsScene.js",

  // IDE
  "src/funkin/ui/IDE/IDEInput.js",
  "src/funkin/ui/IDE/IDEScene.js",

  // Play Scene
  "src/funkin/play/input/PlayInput.js",
  "src/funkin/play/input/inputDebugg.js",
  "src/funkin/play/PlayScene.js",

  // Referee
  "src/funkin/play/data/playScene/gameReferee/gameReferee.js",
  "src/funkin/play/data/playScene/gameReferee/PhaseCountdown.js",
  "src/funkin/play/data/playScene/gameReferee/PhaseEnd.js",
  "src/funkin/play/data/playScene/gameReferee/PhaseInit.js",
  "src/funkin/play/data/playScene/gameReferee/PhasePlaying.js",

  // Cameras
  "src/funkin/play/data/camera/gameCamera.js",
  "src/funkin/play/data/camera/mainCamera.js",
  "src/funkin/play/data/camera/UICamera.js",

  // Data
  "src/funkin/play/data/playScene/getSources/getData.js",
  "src/funkin/play/data/playScene/getSources/getCharts.js",
  "src/funkin/play/data/playScene/getSources/getCharacters.js",
  "src/funkin/play/data/playScene/getSources/getStages.js",
  "src/funkin/play/data/playScene/song/playSongPlaylist.js",
  "src/funkin/play/data/playScene/song/VocalManager.js",
  "src/funkin/play/data/playScene/song/TrackDecoder.js",
  "src/funkin/play/data/playScene/song/TrackPlayer.js",

  // Preload
  "src/funkin/play/data/preload/preloadSong.js",
  "src/funkin/play/data/preload/preloadSkins.js",
  "src/funkin/play/data/preload/playPreload.js",
  "src/funkin/play/data/preload/preloadStage.js",
  "src/funkin/play/data/preload/preloadCharacters.js",

  // UI
  "src/funkin/play/visuals/UI/countDown.js",
  "src/funkin/play/visuals/UI/healthBar/barExclude.js",
  "src/funkin/play/visuals/UI/healthBar/barColors.js",
  "src/funkin/play/visuals/UI/healthBar/healthBar.js",
  "src/funkin/play/visuals/UI/healthBar/healtBarIcons.js",

  // Skins
  "src/funkin/play/visuals/skins/playUISkins.js",
  "src/funkin/play/visuals/skins/SkinDataLoader.js",
  "src/funkin/play/visuals/skins/SkinPathResolver.js",

  // Notes
  "src/funkin/play/visuals/arrows/ArrowsSpawner.js",

  "src/funkin/play/visuals/arrows/notes/note/NotesManager.js",
  "src/funkin/play/visuals/arrows/notes/note/NoteAPI.js",
  "src/funkin/play/visuals/arrows/notes/note/NoteSkin.js",
  "src/funkin/play/visuals/arrows/notes/note/NoteLogic.js",

  "src/funkin/play/visuals/arrows/notes/holdNote/SustainSkin.js",
  "src/funkin/play/visuals/arrows/notes/holdNote/SustainNotesManager.js",
  "src/funkin/play/visuals/arrows/notes/holdNote/SustainAPI.js",
  "src/funkin/play/visuals/arrows/notes/holdNote/SustainRenderer.js",
  "src/funkin/play/visuals/arrows/notes/holdNote/SustainLogic.js",

  "src/funkin/play/visuals/arrows/notes/noteEffects/hold/HoldCoversManager.js",
  "src/funkin/play/visuals/arrows/notes/noteEffects/hold/HoldCoverSkin.js",
  "src/funkin/play/visuals/arrows/notes/noteEffects/hold/HoldCoverLogic.js",

  "src/funkin/play/visuals/arrows/notes/noteEffects/splash/NoteSplashesManager.js",
  "src/funkin/play/visuals/arrows/notes/noteEffects/splash/NoteSplashSkin.js",
  "src/funkin/play/visuals/arrows/notes/noteEffects/splash/NoteSplashLogic.js",

  "src/funkin/play/visuals/arrows/strumelines/strumelinesAPI.js",
  "src/funkin/play/visuals/arrows/strumelines/strumelines.js",
  "src/funkin/play/visuals/arrows/strumelines/strumlineAnimator.js",
  "src/funkin/play/visuals/arrows/strumelines/strumlineSkin.js",
  "src/funkin/play/visuals/arrows/strumelines/strumlineUpdater.js",
  "src/funkin/play/visuals/arrows/strumelines/strumlineLayout.js",
  "src/funkin/play/visuals/arrows/strumelines/strumelineMode.js",
  "src/funkin/play/visuals/arrows/strumelines/strumelineBG.js",

  "src/funkin/play/visuals/arrows/notes/rialNotes.js",
  "src/funkin/play/visuals/arrows/notes/noteDirection.js",
  "src/funkin/play/visuals/arrows/notes/noteDirections.js",

  // Judgment
  "src/funkin/play/visuals/UI/judgment/judgment.js",
  "src/funkin/play/visuals/UI/judgment/popup/judgmentPopUp.js",
  "src/funkin/play/visuals/UI/judgment/popup/comboPopUp.js",
  "src/funkin/play/visuals/UI/judgment/text/scoreText.js",
  "src/funkin/play/visuals/UI/judgment/text/botplayText.js",
  "src/funkin/play/visuals/UI/judgment/PBOTConstants.js",

  // Stage
  "src/funkin/play/visuals/stage/createBG.js",
  "src/funkin/play/visuals/stage/createImages.js",
  "src/funkin/play/visuals/stage/createSprites.js",
  "src/funkin/play/visuals/stage/createAtlasSprite.js",
  "src/funkin/play/visuals/stage/playListSprites.js",

  // Characters
  "src/funkin/play/visuals/characters/sparrowCharacters.js",
  "src/funkin/play/visuals/characters/propsCharacters.js",
  "src/funkin/play/visuals/characters/animateCharacters.js",
  "src/funkin/play/visuals/characters/positionCharacters.js",
  "src/funkin/play/visuals/characters/fallbackCharacters.js",

  // Clean
  "src/funkin/play/data/playScene/clean/CleanAudio.js",
  "src/funkin/play/data/playScene/clean/CleanCameras.js",
  "src/funkin/play/data/playScene/clean/CleanCore.js",
  "src/funkin/play/data/playScene/clean/CleanManagers.js",
  "src/funkin/play/data/playScene/clean/CleanUI.js",
  "src/funkin/play/data/playScene/clean/playCleanUp.js",

  // Misc
  "src/funkin/play/visuals/UI/judgment/score.js",
  "src/funkin/play/visuals/UI/judgment/playerStatics.js",
  "src/funkin/play/data/preload/sessionID.js",
  "src/funkin/play/data/playScene/anti-lag.js",

  // Pause
  "src/funkin/play/visuals/UI/pause/pauseSubScene.js",
  "src/funkin/play/visuals/UI/pause/pauseSubSceneMenu.js",
  "src/funkin/play/visuals/UI/pause/pauseFunctions.js",
];

/**
 * Carga un script individual agregándolo al DOM.
 *
 * @param {string} src - Ruta del script a cargar.
 * @returns {Promise<void>} Promesa que se resuelve cuando el script termina de cargar.
 */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = false;

    script.onload = () => resolve();
    script.onerror = () => {
      console.error(`Error al cargar: ${src}`);
      reject(new Error(`No se pudo cargar el script: ${src}`));
    };

    document.body.appendChild(script);
  });
}

/**
 * Función principal que orquesta la carga secuencial de todos los scripts.
 */
async function initGameScripts() {
  try {
    for (const scriptPath of scriptsToLoad) {
      await loadScript(scriptPath);
    }
    console.log("Scripts cargados");
  } catch (error) {
    console.error("Se detuvo la carga debido a un error crítico:", error);
  }
}

window.addEventListener("DOMContentLoaded", initGameScripts);
