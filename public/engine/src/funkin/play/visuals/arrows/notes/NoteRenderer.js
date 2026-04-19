/**
 * @file NoteRenderer.js
 * Sistema de Renderizado Visual y Skins de las notas regulares.
 */

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.arrows = funkin.play.visuals.arrows || {};
funkin.play.visuals.arrows.notes = funkin.play.visuals.arrows.notes || {};

// ============================================================================
// NOTE SKIN
// ============================================================================
class NoteSkin {
	constructor(manager) {
		this.manager = manager;
		this.scene = manager.scene;
	}

	injectNote(noteData) {
		if (!funkin.play || !funkin.play.uiSkins) return;
		const skinData = funkin.play.uiSkins.get("gameplay.notes");
		if (!skinData) return;

		const assetKey = funkin.play.uiSkins.getAssetKey(skinData.assetPath);
		if (!this.scene.textures.exists(assetKey)) return;

		if (skinData.chromaKey && funkin.play.uiSkins) {
			funkin.play.uiSkins.applyChromaKey(this.scene, assetKey, skinData.chromaKey);
		}

		const spawner = funkin.play.visuals.arrows.ArrowsSpawner;
		if (spawner) {
			const fallbackFrames = spawner.createNoteFallbackFrames(
				this.scene,
				assetKey,
				skinData.animations
			);
			const notesLengthBefore = this.manager.notes.length;

			spawner.spawnNotesArray(
				this.scene,
				this.manager,
				[noteData],
				assetKey,
				skinData,
				fallbackFrames
			);

			if (skinData.blendMode && funkin.play.uiSkins && this.manager.notes.length > notesLengthBefore) {
				for (let i = notesLengthBefore; i < this.manager.notes.length; i++) {
					funkin.play.uiSkins.applyBlendMode(this.manager.notes[i], skinData.blendMode);
				}
			}
		}
	}

	reloadSkin() {
		if (!funkin.play || !funkin.play.uiSkins || !funkin.play.session) return;
		const skinData = funkin.play.uiSkins.get("gameplay.notes");
		if (!skinData) return;

		const assetKey = funkin.play.uiSkins.getAssetKey(skinData.assetPath);
		if (!this.scene.textures.exists(assetKey)) return;

		if (skinData.chromaKey && funkin.play.uiSkins) {
			funkin.play.uiSkins.applyChromaKey(this.scene, assetKey, skinData.chromaKey);
		}

		let fallbackFrames = {};
		const spawner = funkin.play.visuals.arrows.ArrowsSpawner;
		if (spawner) {
			spawner.checkSparrowXML(this.scene, assetKey);
			fallbackFrames = spawner.createNoteFallbackFrames(
				this.scene,
				assetKey,
				skinData.animations
			);
		}

		const scale = skinData.scale !== undefined ? skinData.scale : 0.7;
		const alpha = skinData.alpha !== undefined ? skinData.alpha : 1.0;
		const skinOffset = skinData.Offset || [0, 0];
		const universalFallbackFrame = this.scene.textures.get(assetKey).getFrameNames()[0];

		this.manager.notes.forEach((note) => {
			if (note.anims) note.stop();

			const dirName = funkin.NoteDirection.getDirectionName(note.lane);
			const frameToUse = fallbackFrames[dirName] || universalFallbackFrame;

			note.setTexture(assetKey, frameToUse);
			note.baseScale = scale;
			note.baseAlpha = alpha;
			note.skinOffset = skinOffset;

			if (skinData.blendMode && funkin.play.uiSkins) {
				funkin.play.uiSkins.applyBlendMode(note, skinData.blendMode);
			}

			if (note.active && !note.wasHit && !note.hasMissed) {
				note.setAlpha(alpha);
			}

			if (this.scene.anims.exists(`${assetKey}_note_${dirName}`)) {
				note.play(`${assetKey}_note_${dirName}`);
			}
		});
	}
}
funkin.play.visuals.arrows.notes.NoteSkin = NoteSkin;