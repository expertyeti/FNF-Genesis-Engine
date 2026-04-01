

**funkin.play.session:**
Genera y maneja un ID único para la sesión actual, aislando los recursos en la caché.

* `.generateNewSession()`: Crea un nuevo ID aleatorio para el nivel actual.
* `.get()`: Devuelve el ID de la sesión en curso de forma intacta.
* `.getKey('nombre')`: Concatena el ID de la sesión actual con un nombre de recurso para aislarlo en memoria.
* *(Nueva)* `.setCustomData('llave', valor)`: Permite al modder guardar variables temporales que sobrevivirán mientras dure el nivel.
* *(Nueva)* `.getCustomData('llave')`: Recupera la información guardada por el modder.

```javascript
funkin.play.session.generateNewSession();
funkin.play.session.get();
funkin.play.session.getKey('bf');
funkin.play.session.setCustomData('dialogueWatched', true);
funkin.play.session.getCustomData('dialogueWatched');

```

**funkin.play.chart:**
Carga y parsea el archivo JSON (chart) con los datos y notas de la canción.

* `.loadChart(playData)`: Descarga el archivo JSON correcto basándose en la canción y la dificultad.
* `.get('ruta')`: Extrae datos específicos del chart con un texto simple, como la velocidad o el BPM.
* *(Nueva)* `.setScrollSpeed(velocidad)`: Cambia la velocidad a la que caen las notas dinámicamente en plena partida.
* *(Nueva)* `.injectNote(tiempo, direccion, esJugador, tipo)`: Crea notas extra por código para eventos sorpresa.

```javascript
funkin.play.chart.loadChart(playData);
funkin.play.chart.get('metadata.audio.bpm');
funkin.play.chart.setScrollSpeed(2.5);
funkin.play.chart.injectNote(50000, 1, true, 'fireNote');

```


**funkin.play.conductor:**
Controlador de ritmo global de la canción que sincroniza todo el juego.

* `.bpm.set(bpm)`: Define o cambia el pulso musical (BPM) de la canción.
* `.songPosition`: Propiedad directa que almacena y actualiza el tiempo de la canción en milisegundos.
* *(Nueva)* `.getBeat()`: Devuelve matemáticamente en qué "golpe" o compás va la canción.
* *(Nueva)* `.getStep()`: Devuelve el "paso" actual, cuatro veces más rápido que el beat para cálculos milimétricos.
* *(Nueva)* `.changeBPM(bpm, duracion)`: Hace una transición suave hacia un nuevo ritmo.

```javascript
funkin.play.conductor.bpm.set(120);
funkin.play.conductor.songPosition = 1500;
funkin.play.conductor.getBeat();
funkin.play.conductor.getStep();
funkin.play.conductor.changeBPM(200, 1000);

```

**funkin.play.notes:**
API global para interactuar, escuchar eventos o buscar información de las notas.

* `.event('nombre', callback)`: Suscribe una función para que se active en eventos como aciertos o fallos.
* `.emit('nombre', data)`: Dispara un evento propio enviando información en un objeto.
* `.get.all()`: Devuelve el array completo con todas las notas generadas.
* `.get.byLane(carril, esJugador)`: Devuelve las notas activas filtrando por carril y por personaje.
* `.get.upcoming(esJugador, tiempo)`: Devuelve las notas que están a punto de tocar la flecha dentro de un límite de milisegundos.
* `.lastHit`: Variable que guarda los detalles (precisión, puntaje) de la última nota tocada o fallada.
* *(Nueva)* `.forEachActive(callback)`: Recorre en bucle todas las notas actualmente visibles en pantalla para inyectarles fórmulas matemáticas (efectos Modchart de olas o zig-zags).
* *(Nueva)* `.destroyAllUpcoming(esJugador)`: Destruye todas las notas pendientes, útil para iniciar escenas de diálogo.

```javascript
funkin.play.notes.event('noteHit', console.log);
funkin.play.notes.emit('spawn', { note: null });
funkin.play.notes.get.all();
funkin.play.notes.get.byLane(1, true);
funkin.play.notes.get.upcoming(true, 1500);
funkin.play.notes.lastHit = { pressed: true, ms: 10, absMs: 10, judgment: 'sick', score: 350 };
funkin.play.notes.forEachActive(console.log);
funkin.play.notes.destroyAllUpcoming(true);

```

**funkin.play.strumlines:**
API global para manipular o escuchar eventos de las flechas base estáticas.

* `.event('nombre', callback)`: Escucha eventos como el cambio de animación en una flecha.
* `.player.pos.get()`: Consulta las coordenadas de todas las flechas del jugador.
* `.player.pos.set([x,y])`: Mueve en bloque todas las flechas del jugador.
* `.enemy.pos.get()`: Consulta las coordenadas de todas las flechas del oponente.
* `.enemy.pos.set([x,y])`: Mueve en bloque todas las flechas del oponente.
* `.directions.player.pos.get(dir)`: Consulta la posición aislada de una flecha específica (ej. 'left').
* `.directions.player.pos.set(dir, [x,y])`: Mueve de forma aislada una flecha específica.
* *(Nueva)* `.player.setAngle(grados)`: Rota todo el bloque de flechas del jugador simultáneamente.
* *(Nueva)* `.enemy.setAngle(grados)`: Rota todo el bloque de flechas del enemigo simultáneamente.
* *(Nueva)* `.directions.player.setAlpha(dir, opacidad)`: Oculta o desvanece individualmente flechas para eventos de ceguera.

```javascript
funkin.play.strumlines.event('action', console.log);
funkin.play.strumlines.player.pos.get();
funkin.play.strumlines.player.pos.set([600, 50]);
funkin.play.strumlines.enemy.pos.get();
funkin.play.strumlines.enemy.pos.set([100, 50]);
funkin.play.strumlines.directions.player.pos.get('left');
funkin.play.strumlines.directions.player.pos.set('left', [550, 50]);
funkin.play.strumlines.player.setAngle(180);
funkin.play.strumlines.enemy.setAngle(45);
funkin.play.strumlines.directions.player.setAlpha('up', 0);

```

**funkin.play.camera:**
Gestor que agrupa todas las cámaras de la partida y decide su renderizado.

* `.game`: Propiedad directa de la cámara del escenario 3D.
* `.ui`: Propiedad directa de la cámara de la interfaz gráfica.
* `.main`: Propiedad directa de la cámara principal general.
* `.game.pos.set([x,y])`: Indica una coordenada a la que la cámara debe viajar y moverse de forma suave.
* `.addObjToGame(obj)`: Forza a un sprite a dibujarse solo en el escenario.
* `.addObjToUI(obj)`: Forza a un sprite a dibujarse solo y estático en la UI.
* *(Nueva)* `.game.flash(colorHex, duracion)`: Genera un relámpago en la pantalla ideal para transiciones o impactos fuertes.
* *(Nueva)* `.game.shake(intensidad, duracion)`: Aplica un temblor violento a la cámara para enfatizar gritos o golpes.
* *(Nueva)* `.setLerp(valor)`: Aumenta o disminuye la fricción de seguimiento para que la cámara sea más agresiva o más lenta.

```javascript
funkin.play.camera.game.setZoom(1.2);
funkin.play.camera.ui.setAlpha(0.8);
funkin.play.camera.game.pos.set([300, 200]);
funkin.play.camera.addObjToGame(spriteEscenario);
funkin.play.camera.addObjToUI(spriteBoton);
funkin.play.camera.game.flash(0xffffff, 500);
funkin.play.camera.game.shake(0.05, 100);
funkin.play.camera.setLerp(0.1);

```

**funkin.play.preload:**
Concentrador que pre-descarga todo lo pesado (música, escenarios, personajes).

* `.preloadAudio(scene, songName)`: Busca las instrumentales y voces y las pone a cargar en Phaser.
* `.stage.preloadStageAssets(scene, stageName)`: Encola y descarga las imágenes y atlas del escenario.
* `.preloadCharacters(scene)`: Lee la lista y carga los spritesheets de los personajes.
* `.get('ruta')`: Devuelve las llaves en memoria confirmando que el recurso de audio fue descargado.
* `.stage.get('ruta')`: Devuelve las propiedades gráficas en memoria de los recursos del escenario descargados.
* *(Nueva)* `.loadDynamicAsset(tipo, url, key)`: Permite descargar assets desde internet a mitad de la partida para mods dinámicos.

```javascript
funkin.play.preload.preloadAudio(scene, 'CancionPrueba');
funkin.play.preload.stage.preloadStageAssets(scene, 'EscenarioPrueba');
funkin.play.preload.preloadCharacters(scene);
funkin.play.preload.get('instrumental');
funkin.play.preload.stage.get('fondoPrincipal');
funkin.play.preload.loadDynamicAsset('image', 'https://...', 'memePic');

```

**funkin.play.audio:**
Maneja la reproducción del sonido general del nivel.

* `.play(tipo)`: Reproduce juntas las pistas o decide arrancar solo voces/instrumental.
* `.stop()`: Detiene por completo la reproducción limpiando las pistas.
* `.pause()`: Pausa todas las pistas en el punto actual.
* `.resume()`: Reanuda las pistas que estaban en pausa.
* *(Nueva)* `.setPitch(valor)`: Acelera o ralentiza la reproducción de las voces e instrumental, alterando su tono simultáneamente.
* *(Nueva)* `.fadeTo(volumen, duracion)`: Disminuye la música gradualmente para darle dramatismo a una parte de la canción.

```javascript
funkin.play.audio.play('All');
funkin.play.audio.pause();
funkin.play.audio.resume();
funkin.play.audio.stop();
funkin.play.audio.setPitch(1.5);
funkin.play.audio.fadeTo(0, 2000);

```

**funkin.play.countDown:**
Controla la secuencia visual del temporizador inicial del nivel.

* `.start()`: Arranca el bucle de temporizadores basados en el BPM.
* `.tick()`: Lanza el siguiente paso visual (3, 2, 1, GO).
* `.finish()`: Cierra la cuenta regresiva y libera el juego.
* *(Nueva)* `.cancel()`: Aborta de inmediato la animación inicial para soltar al jugador directamente en la canción.

```javascript
funkin.play.countDown.start();
funkin.play.countDown.tick();
funkin.play.countDown.finish();
funkin.play.countDown.cancel();

```

**funkin.play.stats:**
Objeto bruto que guarda los puntos de la partida en vivo.

* `.combo`: Propiedad directa que guarda el contador de notas acertadas consecutivas.
* `.maxCombo`: Propiedad directa para el récord del combo más alto.
* `.misses`: Propiedad directa con el número de notas falladas.
* `.score`: Propiedad directa de la puntuación acumulada.
* `.rating`: Propiedad directa para la calificación general (S, A, B).
* *(Nueva)* `.health`: Modificador numérico (de 0 a 100) que representa la vida actual.
* *(Nueva)* `.drainHealth(cantidad)`: Castiga al jugador quitándole porcentaje de la barra de vida a través de eventos externos.

```javascript
funkin.play.stats.combo = 15;
funkin.play.stats.maxCombo = 40;
funkin.play.stats.misses = 3;
funkin.play.stats.score = 2500;
funkin.play.stats.rating = 'A';
funkin.play.stats.health = 50;
funkin.play.stats.drainHealth(10);

```

**funkin.play.controls:**
Objeto que actualiza instantáneamente los botones presionados.

* `.NOTE_LEFT`: Booleano que indica si se presiona la flecha izquierda.
* `.ACCEPT_P`: Booleano que indica si se presiona el botón de aceptar.
* `.PAUSE_P`: Booleano que indica si se presiona pausar.
* `.BACK_P`: Booleano que indica si se presiona regresar.
* *(Nueva)* `.lockInput(booleano)`: Corta completamente la lectura del teclado, ideal para cinemáticas.
* *(Nueva)* `.forcePress('tecla')`: Emula una pulsación de código para jugar el nivel de forma automática (botplay).

```javascript
funkin.play.controls.NOTE_LEFT = true;
funkin.play.controls.ACCEPT_P = false;
funkin.play.controls.PAUSE_P = true;
funkin.play.controls.BACK_P = false;
funkin.play.controls.lockInput(true);
funkin.play.controls.forcePress('NOTE_UP');

```

**funkin.play.parser:**
Estandarizador de configuración de nivel.

* `.parse(sceneData)`: Toma la información con la que inicia la escena y devuelve un objeto formateado.
* *(Nueva)* `.overrideDifficulty('dificultad')`: Transforma la dificultad actual engañando a la escena para la recarga posterior.

```javascript
funkin.play.parser.parse(payloadData);
funkin.play.parser.overrideDifficulty('nightmare');

```

**funkin.play.cleanUp:**
Script de autodestrucción estático.

* `.execute(scene)`: Elimina variables, audios y memorias antes de cambiar de escena para evitar fugas.
* *(Nueva)* `.registerCustomMod(callback)`: Da un espacio al modder para incluir un script propio que destruya todos sus inventos y objetos especiales antes de purgar la memoria.

```javascript
funkin.play.cleanUp.execute(scene);
funkin.play.cleanUp.registerCustomMod(console.log);

```

**funkin.play.pauseMenu:**
Aloja métodos directos y seguros para manejar la pausa.

* `.pause(scene)`: Congela la escena principal y abre el menú visual de pausa.
* `.resume(scene)`: Cierra el menú y reanuda el movimiento y la música.
* `.exit(scene)`: Abandona el juego limpiando y volviendo al menú de origen.
* *(Nueva)* `.disablePause(booleano)`: Bloquea agresivamente que el jugador huya mediante el menú de pausa durante fases difíciles de un mod.

```javascript
funkin.play.pauseMenu.pause(pauseScene);
funkin.play.pauseMenu.resume(pauseScene);
funkin.play.pauseMenu.exit(pauseScene);
funkin.play.pauseMenu.disablePause(true);

```

**funkin.play.math:** Utilidades matemáticas rápidas sin instancia.

* `.getDirectionName(dir)`: Devuelve el string del carril (ej. 'left').
* `.getColorName(dir)`: Devuelve el color asociado al carril.
* `.getBaseLane(dir)`: Asegura y devuelve un índice del 0 al 3.
* `.isPlayerNote(p)`: Comprueba si la nota corresponde al jugador.
* `.getXPosition(lane, isPlayer, strumlinesInstance)`: Devuelve el eje exacto de X de donde debe caer una nota.
* `.getYPosition(lane, isPlayer, strumlinesInstance)`: Devuelve el eje exacto de Y de las flechas base.
* *(Nueva)* `.getSineWaveX(lane, time, amplitude, frequency)`: Fórmulas que los modders pueden invocar para que las flechas y notas bailen usando ondas senoidales perfectas.

```javascript
funkin.play.math.getDirectionName(0);
funkin.play.math.getColorName(1);
funkin.play.math.getBaseLane(2);
funkin.play.math.isPlayerNote(1);
funkin.play.math.getXPosition(0, true, strumlinesInstance);
funkin.play.math.getYPosition(0, true, strumlinesInstance);
funkin.play.math.getSineWaveX(0, 1000, 50, 2);

```