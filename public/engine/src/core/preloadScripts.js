// src/core/preloadScripts.js
/**
 * Strict sequential injector for all Genesis Engine scripts.
 */

if (!window.BASE_URL) {
  window.BASE_URL = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, "/");
}

const scriptsToLoad = [
  "https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js",

  window.BASE_URL + "src/core/namespaces.js",
  window.BASE_URL + "src/utils/conductor.js",
  window.BASE_URL + "src/utils/alphabet/AlphabetData.js",
  window.BASE_URL + "src/utils/alphabet/Alphabet.js",
  window.BASE_URL + "src/utils/controls/controls.js",
  window.BASE_URL + "src/utils/controls/cursors/mobileTouch.js",
  window.BASE_URL + "src/utils/animations/sparrow/SparrowParser.js",
  window.BASE_URL + "src/core/game.js",

  window.BASE_URL + "src/core/globalHUD.js",
  window.BASE_URL + "src/core/native/mobileBridge.js",
  window.BASE_URL + "src/core/native/isMobile.js",
  window.BASE_URL + "src/utils/mobile/MobileHitbox.js",
  window.BASE_URL + "src/utils/mobile/MobileBackButton.js",
  window.BASE_URL + "src/utils/mobile/MobilePauseBtn.js",
  window.BASE_URL + "src/utils/soundtray/sountrayLogic.js",
  window.BASE_URL + "src/utils/soundtray/soundTrayVisual.js",

  window.BASE_URL + "src/utils/effects/flash.js",
  window.BASE_URL + "src/utils/effects/TransitionScene.js",

  window.BASE_URL + "src/utils/debugging/hotReload.js",
  window.BASE_URL + "src/utils/debugging/play/camera.js",
  window.BASE_URL + "src/utils/debugging/play/song.js",
  window.BASE_URL + "src/utils/debugging/play/stage/characterPositionDebug.js",
  window.BASE_URL + "src/utils/debugging/play/stage/simpleMode.js",
  window.BASE_URL + "src/utils/debugging/arrows/modes.js",

  window.BASE_URL + "src/funkin/ui/intro/introDancing/introDanceEventBus.js",
  window.BASE_URL + "src/funkin/ui/intro/introDancing/funScript.js",
  window.BASE_URL + "src/funkin/ui/intro/introDancing/introDanceAnims.js",
  window.BASE_URL + "src/funkin/ui/intro/introDancing/IntroDance.js",

  window.BASE_URL + "src/funkin/ui/mainMenu/MainMenuEventBus.js",
  window.BASE_URL + "src/funkin/ui/mainMenu/MenuOptionSprite.js",
  window.BASE_URL + "src/funkin/ui/mainMenu/MainMenuOptions.js",
  window.BASE_URL + "src/funkin/ui/mainMenu/MainMenuBackground.js",
  window.BASE_URL + "src/funkin/ui/mainMenu/MainMenuEngineVer.js",
  window.BASE_URL + "src/funkin/ui/mainMenu/MenuInputHandler.js",
  window.BASE_URL + "src/funkin/ui/mainMenu/MainMenuSelection.js",
  window.BASE_URL + "src/funkin/ui/mainMenu/MainMenuScene.js",

  window.BASE_URL + "src/funkin/ui/storyMode/StoryModeData.js",
  window.BASE_URL + "src/funkin/ui/storyMode/StoryModeInput.js",
  window.BASE_URL + "src/funkin/ui/storyMode/StoryModeTitles.js",
  window.BASE_URL + "src/funkin/ui/storyMode/StoryModeProps.js",
  window.BASE_URL + "src/funkin/ui/storyMode/StoryModeTracks.js",
  window.BASE_URL + "src/funkin/ui/storyMode/StoryModeDiff.js",
  window.BASE_URL + "src/funkin/ui/storyMode/StoryModeCharacterProps.js",
  window.BASE_URL + "src/funkin/ui/storyMode/StoryModeUpBar.js",
  window.BASE_URL + "src/funkin/ui/storyMode/StoryModeScene.js",

  window.BASE_URL + "src/funkin/ui/freeplay/FreePlayBG.js",
  window.BASE_URL + "src/funkin/ui/freeplay/FreePlayDiff.js",
  window.BASE_URL + "src/funkin/ui/freeplay/FreePlayInput.js",
  window.BASE_URL + "src/funkin/ui/freeplay/FreePlaySongs.js",
  window.BASE_URL + "src/funkin/ui/freeplay/FreePlayScene.js",

  window.BASE_URL + "src/funkin/play/visuals/UI/judgment/PBOTConstants.js",
  window.BASE_URL + "src/funkin/play/visuals/UI/judgment/playerStatics.js",
  window.BASE_URL + "src/funkin/play/data/preload/sessionID.js",
  window.BASE_URL + "src/funkin/play/data/playScene/anti-lag.js",
  window.BASE_URL + "src/funkin/play/data/playScene/clean/CleanCore.js",
  window.BASE_URL + "src/funkin/play/data/playScene/clean/CleanAudio.js",
  window.BASE_URL + "src/funkin/play/data/playScene/clean/CleanCameras.js",
  window.BASE_URL + "src/funkin/play/data/playScene/clean/CleanManagers.js",
  window.BASE_URL + "src/funkin/play/data/playScene/clean/CleanUI.js",
  window.BASE_URL + "src/funkin/play/data/playScene/clean/playCleanUp.js",

  // INYECTAMOS EL NUEVO MODO LOCAL
  window.BASE_URL + "src/funkin/play/data/playScene/TwoPlayerLocal.js",

  window.BASE_URL + "src/funkin/play/data/camera/mainCamera.js",
  window.BASE_URL + "src/funkin/play/data/camera/gameCamera.js",
  window.BASE_URL + "src/funkin/play/data/camera/UICamera.js",
  window.BASE_URL + "src/funkin/play/data/camera/cameraBooping.js",

  window.BASE_URL + "src/funkin/play/visuals/stage/createImages.js",
  window.BASE_URL + "src/funkin/play/visuals/stage/createSprites.js",
  window.BASE_URL + "src/funkin/play/visuals/stage/createAtlasSprite.js",
  window.BASE_URL + "src/funkin/play/visuals/stage/createBG.js",
  window.BASE_URL + "src/funkin/play/visuals/stage/playListSprites.js",

  window.BASE_URL + "src/funkin/play/visuals/skins/SkinPathResolver.js",
  window.BASE_URL + "src/funkin/play/visuals/skins/SkinDataLoader.js",
  window.BASE_URL + "src/funkin/play/visuals/skins/playUISkins.js",
  window.BASE_URL + "src/funkin/play/visuals/characters/sparrowCharacters.js",
  window.BASE_URL + "src/funkin/play/visuals/characters/fallbackCharacters.js",
  window.BASE_URL + "src/funkin/play/visuals/characters/positionCharacters.js",
  window.BASE_URL + "src/funkin/play/visuals/characters/propsCharacters.js",
  window.BASE_URL + "src/funkin/play/visuals/characters/animateCharacters.js",

  window.BASE_URL + "src/funkin/play/visuals/UI/healthBar/barColors.js",
  window.BASE_URL + "src/funkin/play/visuals/UI/healthBar/barExclude.js",
  window.BASE_URL + "src/funkin/play/visuals/UI/healthBar/healtBarIcons.js",
  window.BASE_URL + "src/funkin/play/visuals/UI/healthBar/healthBar.js",
  window.BASE_URL + "src/funkin/play/visuals/UI/judgment/text/botplayText.js",
  window.BASE_URL + "src/funkin/play/visuals/UI/judgment/text/scoreText.js",
  window.BASE_URL + "src/funkin/play/visuals/UI/judgment/popup/comboPopUp.js",
  window.BASE_URL + "src/funkin/play/visuals/UI/judgment/popup/judgmentPopUp.js",
  window.BASE_URL + "src/funkin/play/visuals/UI/countDown.js",
  window.BASE_URL + "src/funkin/play/visuals/UI/pause/pauseFunctions.js",
  window.BASE_URL + "src/funkin/play/visuals/UI/pause/pauseSubSceneMenu.js",
  window.BASE_URL + "src/funkin/play/visuals/UI/pause/pauseSubScene.js",

  window.BASE_URL + "src/funkin/play/data/playScene/getSources/getSongs.js",
  window.BASE_URL + "src/funkin/play/data/playScene/song/TrackPlayer.js",
  window.BASE_URL + "src/funkin/play/data/playScene/song/VocalManager.js",
  window.BASE_URL + "src/funkin/play/data/playScene/song/playSongPlaylist.js",
  window.BASE_URL + "src/funkin/play/data/playScene/getSources/getData.js",
  window.BASE_URL + "src/funkin/play/data/playScene/getSources/getCharacters.js",
  window.BASE_URL + "src/funkin/play/data/playScene/getSources/getCharts.js",
  window.BASE_URL + "src/funkin/play/data/playScene/getSources/getStages.js",

  window.BASE_URL + "src/funkin/play/visuals/arrows/notes/noteDirection.js",
  window.BASE_URL + "src/funkin/play/visuals/arrows/notes/noteDirections.js",
  window.BASE_URL + "src/funkin/play/visuals/arrows/notes/rialNotes.js",
  window.BASE_URL + "src/funkin/play/visuals/arrows/notes/noteEffects/splash/NoteSplashSkin.js",
  window.BASE_URL + "src/funkin/play/visuals/arrows/notes/noteEffects/splash/NoteSplashLogic.js",
  window.BASE_URL + "src/funkin/play/visuals/arrows/notes/noteEffects/splash/NoteSplashesManager.js",
  window.BASE_URL + "src/funkin/play/visuals/arrows/notes/noteEffects/hold/HoldCoverSkin.js",
  window.BASE_URL + "src/funkin/play/visuals/arrows/notes/noteEffects/hold/HoldCoverLogic.js",
  window.BASE_URL + "src/funkin/play/visuals/arrows/notes/noteEffects/hold/HoldCoversManager.js",
  window.BASE_URL + "src/funkin/play/visuals/arrows/notes/note/NoteSkin.js",

  window.BASE_URL + "src/funkin/play/visuals/arrows/notes/note/NoteLogic.js",
  window.BASE_URL + "src/funkin/play/visuals/arrows/notes/note/logic/playMissSound.js",
  window.BASE_URL + "src/funkin/play/visuals/arrows/notes/note/logic/update.js",
  window.BASE_URL + "src/funkin/play/visuals/arrows/notes/note/logic/handleRewind.js",
  window.BASE_URL + "src/funkin/play/visuals/arrows/notes/note/logic/processInputs.js",
  window.BASE_URL + "src/funkin/play/visuals/arrows/notes/note/logic/registerHit.js",
  window.BASE_URL + "src/funkin/play/visuals/arrows/notes/note/logic/registerMiss.js",
  window.BASE_URL + "src/funkin/play/visuals/arrows/notes/note/logic/updateMovement.js",
  window.BASE_URL + "src/funkin/play/visuals/arrows/notes/note/logic/executeAutoHit.js",
  window.BASE_URL + "src/funkin/play/visuals/arrows/notes/note/logic/executeLateMiss.js",
  window.BASE_URL + "src/funkin/play/visuals/arrows/notes/note/logic/syncNotePosition.js",

  window.BASE_URL + "src/funkin/play/visuals/arrows/notes/note/NoteAPI.js",
  window.BASE_URL + "src/funkin/play/visuals/arrows/notes/note/NotesManager.js",
  window.BASE_URL + "src/funkin/play/visuals/arrows/notes/holdNote/SustainSkin.js",
  window.BASE_URL + "src/funkin/play/visuals/arrows/notes/holdNote/SustainLogic.js",
  window.BASE_URL + "src/funkin/play/visuals/arrows/notes/holdNote/SustainAPI.js",
  window.BASE_URL + "src/funkin/play/visuals/arrows/notes/holdNote/SustainRenderer.js",
  window.BASE_URL + "src/funkin/play/visuals/arrows/notes/holdNote/SustainNotesManager.js",

  window.BASE_URL + "src/funkin/play/visuals/arrows/strumelines/strumlineSkin.js",
  window.BASE_URL + "src/funkin/play/visuals/arrows/strumelines/middlescroll/DefaultMode.js",
  window.BASE_URL + "src/funkin/play/visuals/arrows/strumelines/middlescroll/NormalMode.js",
  window.BASE_URL + "src/funkin/play/visuals/arrows/strumelines/middlescroll/NarrowMode.js",
  window.BASE_URL + "src/funkin/play/visuals/arrows/strumelines/middlescroll/WideMode.js",
  window.BASE_URL + "src/funkin/play/visuals/arrows/strumelines/middlescroll/SplitMode.js",
  window.BASE_URL + "src/funkin/play/visuals/arrows/strumelines/middlescroll/MiddlescrollHandler.js",
  window.BASE_URL + "src/funkin/play/visuals/arrows/strumelines/schedules/arrows.js",
  window.BASE_URL + "src/funkin/play/visuals/arrows/strumelines/strumlineLayout.js",
  window.BASE_URL + "src/funkin/play/visuals/arrows/strumelines/strumelineBG.js",
  window.BASE_URL + "src/funkin/play/visuals/arrows/strumelines/strumelinesAPI.js",
  window.BASE_URL + "src/funkin/play/visuals/arrows/strumelines/strumlineAnimator.js",
  window.BASE_URL + "src/funkin/play/visuals/arrows/strumelines/strumlineUpdater.js",
  window.BASE_URL + "src/funkin/play/visuals/arrows/strumelines/strumelines.js",
  window.BASE_URL + "src/funkin/play/visuals/arrows/ArrowsSpawner.js",

  window.BASE_URL + "src/funkin/play/input/inputDebugg.js",
  window.BASE_URL + "src/funkin/play/input/PlayInput.js",

  window.BASE_URL + "src/funkin/play/data/playScene/gameReferee/PhaseInit.js",
  window.BASE_URL + "src/funkin/play/data/playScene/gameReferee/PhaseCountdown.js",
  window.BASE_URL + "src/funkin/play/data/playScene/gameReferee/PhasePlaying.js",
  window.BASE_URL + "src/funkin/play/data/playScene/gameReferee/PhaseEnd.js",
  window.BASE_URL + "src/funkin/play/data/playScene/gameReferee/gameReferee.js",

  window.BASE_URL + "src/funkin/play/data/preload/preloadCharacters.js",
  window.BASE_URL + "src/funkin/play/data/preload/preloadSkins.js",
  window.BASE_URL + "src/funkin/play/data/preload/preloadSong.js",
  window.BASE_URL + "src/funkin/play/data/preload/preloadStage.js",
  window.BASE_URL + "src/funkin/play/data/preload/playPreload.js",

  window.BASE_URL + "src/funkin/play/PlayScene.js",

  window.BASE_URL + "src/funkin/ui/intro/introText/introText.js",
  window.BASE_URL + "src/funkin/ui/intro/loading/loading.js",
];

function loadScriptsInOrder(scripts, index = 0) {
  if (index >= scripts.length) {
    console.log("System injected correctly. Booting up...");
    return;
  }
  const script = document.createElement("script");
  script.src = scripts[index];

  script.onload = () => loadScriptsInOrder(scripts, index + 1);
  script.onerror = () => {
    console.error("Error loading critical script (check path):", scripts[index]);
    loadScriptsInOrder(scripts, index + 1);
  };

  document.head.appendChild(script);
}

loadScriptsInOrder(scriptsToLoad);