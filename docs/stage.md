**funkin.play.stage:**
Carga, parsea y manipula en tiempo real absolutamente todos los elementos gráficos, físicos y rítmicos del escenario (Stage). A partir de ahora, **todos los métodos aceptan el nombre del elemento ('string') o su número de capa (número)** como primer parámetro.

* `.loadStage()`: Descarga el archivo del escenario a la memoria.
* `.get.data('nombrePath' | capa)`: Obtiene el bloque JSON de configuración de un elemento. Si se deja vacío, devuelve el JSON completo.
* `.get.sprite('nombrePath' | capa)`: Extrae el objeto real de la imagen/textura para aplicarle efectos crudos de Phaser.
* `.set.tint('nombrePath' | capa, [colorHex])`: Tiñe un elemento del fondo para simular luces o sombras.
* `.set.scale('nombrePath' | capa, [x, y])`: Modifica el tamaño de un elemento en los ejes X e Y.
* `.set.opacity('nombrePath' | capa, valor)`: Cambia la transparencia de un elemento (de 0.0 a 1.0).
* `.set.position('nombrePath' | capa, [x, y])`: Mueve un elemento del fondo a unas nuevas coordenadas instantáneamente.
* `.set.visible('nombrePath' | capa, booleano)`: Oculta (`false`) o muestra (`true`) un objeto del escenario.
* `.set.blendMode('nombrePath' | capa, 'modo')`: Cambia el modo de mezcla gráfica (ej. 'ADD' o 'MULTIPLY').
* `.set.cameraOffset('nombrePath' | capa, [x, y])`: Modifica el punto exacto hacia donde la cámara debe mirar cuando enfoca a este elemento.
* `.set.flipX('nombrePath' | capa, booleano)` / `.set.flipY('nombrePath' | capa, booleano)`: Voltea la imagen de forma horizontal o vertical.
* `.set.scrollFactor('nombrePath' | capa, [x, y])`: Ajusta la fuerza del efecto Parallax (qué tanto se mueve el objeto respecto a la cámara).
* `.set.origin('nombrePath' | capa, [x, y])`: Cambia el punto de anclaje de la imagen (0,0 esquina superior izquierda, 0.5, 0.5 centro).
* `.set.frameRate('nombrePath' | capa, fps)`: Ajusta la velocidad de reproducción de un spritesheet animado.
* `.set.animationPlayMode('nombrePath' | capa, 'modo')`: Cambia si la animación se repite infinitamente ('Loop') o solo una vez ('Once').
* `.set.animationBeat('nombrePath' | capa, [beats])`: Cambia cada cuántos golpes de ritmo (beats) se debe reproducir la animación.
* `.set.chromaKey('nombrePath' | capa, [colorHex])`: Aplica un filtro para volver transparente un color específico.
* `.set.fx('nombrePath' | capa, 'NombreDelEfecto', { opciones })`: Aplica un efecto visual nativo de Phaser (Post-FX) al elemento.
* `.set.clearFX('nombrePath' | capa)`: Elimina todos los efectos nativos aplicados sobre el elemento.
* `.set.pipeline('nombrePath' | capa, 'nombrePipeline', { opciones })`: Aplica un pipeline de renderizado personalizado (como shaders, distorsión VHS, lente de barril, etc.) al elemento.
* `.set.resetPipeline('nombrePath' | capa)`: Elimina el pipeline personalizado y devuelve el elemento a su renderizado normal.

```javascript
funkin.play.stage.loadStage();

funkin.play.stage.get.data('playergf');
funkin.play.stage.get.data(2);
funkin.play.stage.get.sprite('lights');
funkin.play.stage.get.sprite(1);

funkin.play.stage.set.tint('bg', [0x444455]);
funkin.play.stage.set.scale(4, [1.2, 1.2]);
funkin.play.stage.set.opacity('brightLightSmall', 0.8);
funkin.play.stage.set.position(5, [366, -300]);
funkin.play.stage.set.visible('server', false);

funkin.play.stage.set.cameraOffset('enemy', [250, 200]);
funkin.play.stage.set.cameraOffset(7, [250, 200]);
funkin.play.stage.set.flipX(1, true);
funkin.play.stage.set.scrollFactor('lights', [1.5, 1.5]);
funkin.play.stage.set.origin(1, [0.5, 0.5]);

funkin.play.stage.set.frameRate('crowd', 30);
funkin.play.stage.set.animationPlayMode(1, 'Once');
funkin.play.stage.set.animationBeat(1, [2]);
funkin.play.stage.set.chromaKey(2, [0x00ff00]);

// Modos de fusión y Efectos (WebGL)
funkin.play.stage.set.blendMode(3, 'ADD');
funkin.play.stage.set.fx('bg', 'Barrel', { amount: 1.1 });
funkin.play.stage.set.pipeline('skyBackground', 'rexKawaseBlurPipeline', { blur: 4, quality: 3 });

```

> [!NOTE]
> **Catálogo de Efectos y Valores (WebGL)**
> **1. Blend Modes Disponibles (String):**
> `'NORMAL'`, `'ADD'`, `'MULTIPLY'`, `'SCREEN'`, `'OVERLAY'`, `'DARKEN'`, `'LIGHTEN'`, `'COLOR_DODGE'`, `'COLOR_BURN'`, `'HARD_LIGHT'`, `'SOFT_LIGHT'`, `'DIFFERENCE'`, `'EXCLUSION'`, `'HUE'`, `'SATURATION'`, `'COLOR'`, `'LUMINOSITY'`, `'ERASE'`.
> **2. FX Nativos de Phaser (Phaser 3.60+) con sus opciones por defecto:**
> * `Glow`: `{ distance: 10, outerStrength: 2, innerStrength: 0, color: 0xffffff, quality: 0.1 }`
> * `Shadow`: `{ x: 0, y: 0, decay: 0.1, power: 1, color: 0x000000, samples: 10 }`
> * `Pixelate`: `{ amount: 1 }`
> * `Vignette`: `{ x: 0.5, y: 0.5, radius: 0.5, strength: 0.5 }`
> * `Shine`: `{ speed: 0.5, lineWidth: 0.5, gradient: 3, reveal: false }`
> * `Blur`: `{ quality: 0, x: 2, y: 2, steps: 1, color: 0xffffff }`
> * `Gradient`: `{ alpha: 1, color1: 0xff0000, color2: 0x00ff00, fromX: 0, fromY: 0, toX: 1, toY: 1 }`
> * `Bloom`: `{ color: 0xffffff, offsetX: 1, offsetY: 1, blurStrength: 1, strength: 1, steps: 4 }`
> * `ColorMatrix`: `{ alpha: 1 }` *(Ideal para contrastes y saturación)*
> * `Circle`: `{ thickness: 8, color: 0x000000, backgroundColor: 0x000000, scale: 1, feather: 0.005 }`
> * `Wipe`: `{ wipeWidth: 0.1, direction: 0, axis: 0, reveal: false }`
> * `Bokeh`: `{ radius: 0.5, amount: 1, contrast: 0.2 }`
> * `Displacement`: `{ x: 0.005, y: 0.005 }` *(Requiere asignar mapa de desplazamiento previo)*
> * `Barrel`: `{ amount: 1, alpha: 1 }`
> 
> 
> **3. REX Pipelines con sus opciones por defecto:**
> * `rexBarrelPipeline`: `{ barrelCylinder: 1, angle: 0, radius: 0.75, center: {x: 0.5, y: 0.5} }`
> * `rexColorReplacePipeline`: `{ originalColor: 0xffffff, newColor: 0x000000, epsilon: 0.4 }`
> * `rexGlowFilterPipeline`: `{ intensity: 1, outerStrength: 2, innerStrength: 0, color: 0xffffff }`
> * `rexGrayScalePipeline`: `{ intensity: 1 }`
> * `rexHSLAdjustPipeline`: `{ hue: 0, saturation: 1, lightness: 1 }`
> * `rexKawaseBlurPipeline`: `{ blur: 4, quality: 3 }`
> * `rexPixelationPipeline`: `{ pixelWidth: 4, pixelHeight: 4 }`
> * `rexShockwavePipeline`: `{ center: {x: 0.5, y: 0.5}, waveRadius: 0.2, waveWidth: 0.05, amplitude: 0.1 }`
> * `rexToonifyPipeline`: `{ edgeThreshold: 0.2, hueLevels: 5, satLevels: 5, lumLevels: 5, edgeColor: 0x000000 }`
> 
> 

> [!WARNING]
> **Compatibilidad WebGL vs Canvas**
> El motor utiliza **WebGL** por defecto para procesar gráficos con la tarjeta de video, pero se degrada a **Canvas API** en dispositivos muy antiguos o no compatibles.
> * **Blend Modes:** Los modos `'NORMAL'`, `'ADD'`, `'MULTIPLY'`, `'SCREEN'`, `'LIGHTEN'` y `'DARKEN'` son seguros en Canvas. El resto funciona mejor o son exclusivos de WebGL.
> * **Efectos (FX) y Pipelines:** Los comandos `.set.fx` y `.set.pipeline` **REQUIEREN WEBGL ESTRICTAMENTE**. En Canvas, estos comandos serán ignorados para evitar que el juego falle, por lo que tus modcharts visuales avanzados no se renderizarán en dispositivos de muy baja gama.
> 
>
