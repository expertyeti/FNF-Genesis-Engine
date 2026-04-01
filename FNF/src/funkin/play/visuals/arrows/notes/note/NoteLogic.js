/**
 * Logica y ciclo de actualizacion de comportamiento, colisiones y fisicas.
 */
class NoteLogic {
	/**
	 * @param {Object} manager Referencia al administrador de notas
	 */
	constructor(manager) {
		this.manager = manager;
		this.scene = manager.scene;
	}

	/**
	 * @param {boolean} isMyNote 
	 * @param {boolean} isAuto 
	 */
	playMissSound(isMyNote, isAuto) {
		if (isMyNote && !isAuto && this.scene && this.scene.sound) {
			const rnd = Phaser.Math.Between(1, 3);
			const missKey = `missnote${rnd}`;
			if (this.scene.cache.audio.exists(missKey)) {
				this.scene.sound.play(missKey, { volume: 0.6 });
			} else if (this.scene.cache.audio.exists("missnote1")) {
				this.scene.sound.play("missnote1", { volume: 0.6 });
			}
		}
	}

	update(time, delta) {
		if (!funkin.conductor || this.manager.notes.length === 0) return;

		const songPos = funkin.conductor.songPosition;
		const playAsOpponent = funkin.play.options && funkin.play.options.playAsOpponent;
		const isMobileMode = funkin.play.options && funkin.play.options.middlescroll === "mobile";

		if (isMobileMode && this.scene.hitbox && this.scene.hitbox.visible !== false) {
			if (typeof this.scene.hitbox.setVisible === 'function') this.scene.hitbox.setVisible(false);
			else this.scene.hitbox.visible = false;
		}

		let isTimeJumping = false;
		if (this.manager.lastSongPos !== undefined) {
			if (Math.abs(songPos - this.manager.lastSongPos) > 300) isTimeJumping = true;
		}
		this.manager.lastSongPos = songPos;

		this.manager.scrollSpeed =
			funkin.play.chart && funkin.play.chart.get("metadata.speed")
				? funkin.play.chart.get("metadata.speed")
				: 1.0;

		this.handleRewind(songPos);
		this.processInputs(songPos, playAsOpponent, time);
		this.updateMovement(songPos, playAsOpponent, isTimeJumping, time);
	}

	handleRewind(songPos) {
		this.manager.notes.forEach((note) => {
			const timeDiff = note.noteTime - songPos;
			if (timeDiff > 166.0 && (note.wasHit || note.hasMissed)) {
				note.wasHit = false;
				note.hasMissed = false;
				note.visible = true;
				note.active = true;
				note.alpha = note.baseAlpha;
				note.clearTint();
			}
		});
	}

	processInputs(songPos, playAsOpponent, time) {
		const isCountdown = funkin.CountDown && funkin.CountDown.isInCountdown;
		if (isCountdown || window.autoplay) return;

		if (this.scene && this.scene.input && this.scene.input.keyboard) {
			const kb = this.scene.input.keyboard;
			const ctrl = kb.addKey(Phaser.Input.Keyboard.KeyCodes.CTRL).isDown;
			const shift = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT).isDown;
			const alt = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ALT).isDown;

			if (ctrl && shift && alt) return;
		}

		const dirs = funkin.NoteDirection ? funkin.NoteDirection.getMappings().names : ["left", "down", "up", "right"];
		const controlsMapping = dirs.map((dir) => `NOTE_${dir.toUpperCase()}`);
		const currentKeys = controlsMapping.map((key) => !!(funkin.controls && funkin.controls[key]));

		let activePointers = [];
		if (this.scene.input) {
			const pointersArr = this.scene.input.manager ? this.scene.input.manager.pointers : [];
			activePointers = pointersArr.filter((p) => p && p.isDown);
			if (
				this.scene.input.activePointer &&
				this.scene.input.activePointer.isDown &&
				!activePointers.includes(this.scene.input.activePointer)
			) {
				activePointers.push(this.scene.input.activePointer);
			}
		}

		const targetStrums = playAsOpponent
			? this.manager.strumlines?.opponentStrums
			: this.manager.strumlines?.playerStrums;
		
		if (targetStrums) {
			activePointers.forEach((pointer) => {
				targetStrums.forEach((strum, lane) => {
					if (!strum) return;
					
					const originX = strum.originX !== undefined ? strum.originX : 0.5;
					const originY = strum.originY !== undefined ? strum.originY : 0.5;
					
					const w = strum.lastStaticWidth || strum.displayWidth;
					const h = strum.lastStaticHeight || strum.displayHeight;

					const strumCenterX = strum.baseX + (w * (0.5 - originX));
					const strumCenterY = strum.baseY + (h * (0.5 - originY));

					const hitRadiusX = (w || 112) * 0.90;
					const hitRadiusY = 400; 

					if (Math.abs(pointer.x - strumCenterX) <= hitRadiusX) {
						if (Math.abs(pointer.y - strumCenterY) <= hitRadiusY) {
							currentKeys[lane] = true;
						}
					}
				});
			});
		}

		const ghostTappingEnabled = funkin.play.options && funkin.play.options.ghostTapping === true;

		for (let lane = 0; lane < this.manager.keyCount; lane++) {
			if (currentKeys[lane] && !this.manager.prevKeys[lane]) {
				let closestNote = null;
				let closestTime = 166;

				for (let i = 0; i < this.manager.notes.length; i++) {
					const n = this.manager.notes[i];
					const isMyNote = playAsOpponent ? !n.isPlayer : n.isPlayer;

					if (n.active && isMyNote && n.lane === lane && !n.wasHit && !n.hasMissed) {
						const diff = n.noteTime - songPos;
						if (Math.abs(diff) <= 166.0) {
							if (Math.abs(diff) < Math.abs(closestTime)) {
								closestNote = n;
								closestTime = diff;
							}
						}
					}
				}

				if (closestNote) {
					this.registerHit(closestNote, closestTime, lane, time);
				} else {
					if (!ghostTappingEnabled) {
						this.registerMiss(playAsOpponent, lane);
					}
				}
			}
			this.manager.prevKeys[lane] = currentKeys[lane];
		}
	}

	registerHit(closestNote, closestTime, lane, time) {
		const absMs = Math.abs(closestTime);
		let judgment = "shit";
		let score = 50;

		if (absMs <= 5.0) {
			judgment = "perfect";
			score = 500;
		} else if (absMs <= 45.0) {
			judgment = "sick";
			score = 350;
		} else if (absMs <= 90.0) {
			judgment = "good";
			score = 200;
		} else if (absMs <= 135.0) {
			judgment = "bad";
			score = 100;
		} else {
			judgment = "shit";
			score = 50;
		}

		closestNote.wasHit = true;
		closestNote.active = false;
		closestNote.visible = false;
		closestNote.alpha = 0;

		funkin.playNotes.lastHit = {
			pressed: true,
			ms: closestTime,
			absMs: absMs,
			judgment: judgment,
			score: score,
			direction: lane,
			isPlayer: closestNote.isPlayer,
			isAuto: false,
		};
		funkin.playNotes.emit("noteHit", funkin.playNotes.lastHit);

		if (this.scene.animateCharacters) {
			this.scene.animateCharacters.sing(closestNote.isPlayer, lane);
		}

		if (typeof navigator !== "undefined" && navigator.vibrate) {
			navigator.vibrate(15);
		}

		if (this.manager.strumlines) {
			const strums = closestNote.isPlayer
				? this.manager.strumlines.playerStrums
				: this.manager.strumlines.opponentStrums;
			const arrow = strums[lane];
			if (arrow && arrow.playAnim) {
				arrow.playAnim("confirm", true);
				arrow.resetTime = time + 150;
			}
		}
	}

	registerMiss(playAsOpponent, lane) {
		const isPlayerSide = playAsOpponent ? false : true;
		const missData = {
			pressed: true,
			ms: 0,
			absMs: 0,
			judgment: "miss",
			score: -10,
			direction: lane,
			isPlayer: isPlayerSide,
			isAuto: false,
		};
		funkin.playNotes.lastHit = missData;
		funkin.playNotes.emit("noteMiss", missData);
		this.playMissSound(true, false);

		if (this.scene.animateCharacters) {
			this.scene.animateCharacters.playMiss(isPlayerSide, lane);
		}
	}

	updateMovement(songPos, playAsOpponent, isTimeJumping, time) {
		const globalDownscroll = funkin.play.options && funkin.play.options.downscroll;
		const midScrollOption = funkin.play.options && funkin.play.options.middlescroll;
		const isMobile = midScrollOption === "mobile";
		const hideEnemy = funkin.play.options && funkin.play.options.hideOpponentNotes;

		this.manager.notes.forEach((note) => {
			if (!note.active || note.wasHit) return;

			const timeDiff = note.noteTime - songPos;
			const distance = timeDiff * 0.45 * this.manager.scrollSpeed;
			const isMyNoteAuto = playAsOpponent ? !note.isPlayer : note.isPlayer;
			const isAutoHit = !isMyNoteAuto || (isMyNoteAuto && window.autoplay);

			let isDownscroll = globalDownscroll;
			if (isMobile) {
				isDownscroll = isMyNoteAuto;
			}

			if (isAutoHit && timeDiff <= 0 && !note.wasHit && !note.hasMissed) {
				this.executeAutoHit(note, timeDiff, isTimeJumping, time, isMyNoteAuto);
				return;
			}

			if (isMyNoteAuto && timeDiff < -166.0 && !note.hasMissed && !note.wasHit) {
				this.executeLateMiss(note, timeDiff, isTimeJumping, isMyNoteAuto);
			}

			if (!note.hasMissed && (distance > 2500 || distance < -1000)) {
				note.visible = false;
				return;
			} else if (note.hasMissed && distance < -1000) {
				note.visible = false;
				return;
			}

			if (hideEnemy && !isMyNoteAuto) {
				note.visible = false;
			} else {
				note.visible = true;
			}

			this.syncNotePosition(note, distance, isDownscroll);
		});
	}

	executeAutoHit(note, timeDiff, isTimeJumping, time, isMyNoteAuto) {
		note.wasHit = true;
		note.active = false;
		note.visible = false;
		note.alpha = 0;

		if (!isTimeJumping && this.manager.strumlines) {
			const strums = note.isPlayer
				? this.manager.strumlines.playerStrums
				: this.manager.strumlines.opponentStrums;
			const arrow = strums[note.lane];
			if (arrow && arrow.playAnim) {
				arrow.playAnim("confirm", true);
				const extraTime = note.length && note.length > 0 ? note.length : 150;
				arrow.resetTime = time + extraTime;
			}
		}

		funkin.playNotes.lastHit = {
			pressed: true,
			ms: timeDiff,
			absMs: Math.abs(timeDiff),
			judgment: "perfect",
			score: isMyNoteAuto ? 500 : 0,
			direction: note.lane,
			isPlayer: note.isPlayer,
			isAuto: !isMyNoteAuto,
		};
		funkin.playNotes.emit("noteHit", funkin.playNotes.lastHit);

		if (this.scene.animateCharacters) {
			this.scene.animateCharacters.sing(note.isPlayer, note.lane);
		}

		if (isMyNoteAuto && typeof navigator !== "undefined" && navigator.vibrate) {
			navigator.vibrate(15);
		}
	}

	executeLateMiss(note, timeDiff, isTimeJumping, isMyNoteAuto) {
		note.hasMissed = true;

		if (!isTimeJumping) {
			note.alpha = 0.3;
			note.setTint(0x888888);

			const missData = {
				pressed: false,
				ms: timeDiff,
				absMs: Math.abs(timeDiff),
				judgment: "miss",
				score: 0,
				direction: note.lane,
				isPlayer: note.isPlayer,
				isAuto: false,
			};
			funkin.playNotes.lastHit = missData;
			funkin.playNotes.emit("noteMiss", missData);
			this.playMissSound(isMyNoteAuto, false);

			if (this.scene.animateCharacters) {
				this.scene.animateCharacters.playMiss(note.isPlayer, note.lane);
			}
		} else {
			note.active = false;
			note.visible = false;
			note.alpha = 0;
		}
	}

	syncNotePosition(note, distance, isDownscroll) {
		let strumScale = 1.0;
		let strumBaseScale = 1.0;
		let strumAlpha = 1.0;

		let strumCenterX = 0;
		let strumCenterY = 0;

		const targetStrums = note.isPlayer
			? this.manager.strumlines.playerStrums
			: this.manager.strumlines.opponentStrums;

		if (targetStrums && targetStrums[note.lane]) {
			const strum = targetStrums[note.lane];
			strumScale = strum.scaleX;
			strumBaseScale = strum.baseScale || 1.0;
			strumAlpha = strum.alpha;

			const originX = strum.originX !== undefined ? strum.originX : 0.5;
			const originY = strum.originY !== undefined ? strum.originY : 0.5;
			
			// Si la animacion es distinta a estatica y guardamos las dimensiones, usa esas para anclar
			if (strum.currentAction !== 'static' && strum.lastStaticWidth) {
				strumCenterX = strum.baseX + (strum.lastStaticWidth * (0.5 - originX));
				strumCenterY = strum.baseY + (strum.lastStaticHeight * (0.5 - originY));
			} else {
				strum.lastStaticWidth = strum.displayWidth;
				strum.lastStaticHeight = strum.displayHeight;
				strumCenterX = strum.baseX + (strum.displayWidth * (0.5 - originX));
				strumCenterY = strum.baseY + (strum.displayHeight * (0.5 - originY));
			}
		} else {
			const fallbackX = funkin.RialNotes.getXPosition(note.lane, note.isPlayer, this.manager.strumlines);
			const fallbackY = funkin.RialNotes.getYPosition(note.lane, note.isPlayer, this.manager.strumlines);
			strumCenterX = fallbackX + 56;
			strumCenterY = fallbackY + 56;
		}

		const relativeScale = strumScale / strumBaseScale;
		note.setScale(note.baseScale * relativeScale);

		if (!note.hasMissed && !note.wasHit) {
			note.setAlpha(strumAlpha * note.baseAlpha);
		}

		const noteOriginX = note.originX !== undefined ? note.originX : 0.5;
		const noteOriginY = note.originY !== undefined ? note.originY : 0.5;

		const finalX = strumCenterX - (note.displayWidth * (0.5 - noteOriginX)) + ((note.skinOffset[0] || 0) * relativeScale);
		const finalY =
			strumCenterY -
			(note.displayHeight * (0.5 - noteOriginY)) +
			(isDownscroll ? -distance : distance) +
			((note.skinOffset[1] || 0) * relativeScale) +
			this.manager.globalYOffset;

		if (!isNaN(finalX) && !isNaN(finalY)) {
			note.x = Math.round(finalX);
			note.y = Math.round(finalY);
		}
	}
}

if (typeof window !== "undefined") funkin.NoteLogic = NoteLogic;