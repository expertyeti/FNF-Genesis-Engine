
**funkin.play.characters:**
Carga, gestiona y manipula la lógica interna de los personajes en tiempo real (animaciones, posiciones, offsets y reemplazos). *Nota: Los efectos visuales se aplican a través de `funkin.play.stage`.* A partir de ahora, **todos los métodos operan en lote y utilizan un "identificador masivo" (selector)** que permite afectar a uno o múltiples personajes al mismo tiempo dependiendo del criterio de búsqueda.

* `.loadCharacters()`: Descarga y prepara los JSON iniciales de todos los personajes indicados en la partida.
* *(Nueva)* `.add('nombrePersonaje', identificadorRol)`: Invoca a un personaje completamente nuevo al mapa desde cero en mitad de la partida.
* `.get.data(identificador)`: Devuelve el JSON crudo del personaje (útil para leer `camera_offset` o colores).
* `.get.pos(identificador)`: Devuelve un arreglo `[x, y]` con las coordenadas actuales reales en el escenario (sin contar los `animOffsets`).
* `.set.pos(identificador, [x, y])`: Teletransporta al (o los) personaje(s) exactamente a la nueva coordenada del mapa, recalculando su anclaje desde los pies.
* `.set.alpha(identificador, valor)`: Hace que los personajes afectados se vuelvan transparentes o invisibles (de `0.0` a `1.0`). Forzado directo para el renderizador.
* `.set.role(identificador, 'nuevoRol' | numero)`: Manda a un personaje a otro bando para que las flechas/notas lo detecten diferente.
* `.set.assetPath(identificador, 'nuevaRuta')`: Modifica la ruta base de donde el personaje lee sus assets.
* `.modify.pos(identificador, [dx, dy])`: Suma o resta valores a las coordenadas actuales (Desplazamiento) de forma instantánea.
* *(Nueva)* `.modify.character(identificador, 'nombreNuevoPersonaje')`: Realiza un Hot-Swap (Cambio en caliente). Pausa al personaje actual, descarga los assets del nuevo, lo posiciona exactamente en las coordenadas de escenario del viejo, hereda su escala de stage, y elimina al viejo.
* `.anim.play(identificador, 'nombreAnim', forzar)`: Obliga al personaje a ejecutar una animación específica, cortando la anterior.
* `.anim.getOffset(identificador, 'nombreAnim')`: Obtiene las coordenadas de compensación `[x, y]` de una animación específica.
* `.anim.setOffset(identificador, 'nombreAnim', [x, y])`: Modifica matemáticamente los offsets de una animación en tiempo real para corregir desfasajes.
* `.tween.play(identificador, { configuracion })`: Ejecuta interpolaciones fluidas (Tweens) exclusivas para los personajes afectados (saltos, levitación, estiramientos).
* `.script.execute(identificador, 'nombreFuncion', ...args)`: Llama y ejecuta una función específica dentro del script personalizado (.hx o .js) que controla la lógica individual de ese personaje.

```javascript
funkin.play.characters.loadCharacters();
funkin.play.characters.add('tankman', 1);

funkin.play.characters.get.data('0.bf');
funkin.play.characters.get.pos('player');

funkin.play.characters.set.pos('dad', [100, 500]);
funkin.play.characters.set.alpha('0.bf', 0.5);
funkin.play.characters.set.role('gf', 1);
funkin.play.characters.set.assetPath('enemy', 'characters/monster-christmas');

funkin.play.characters.modify.pos('dad', [0, -50]);
funkin.play.characters.modify.character('player', 'pico-player');

funkin.play.characters.anim.play('pico-player', 'singUP', true);
funkin.play.characters.anim.getOffset('dad', 'singLEFT');
funkin.play.characters.anim.setOffset(1, 'singLEFT', [25, -10]);

funkin.play.characters.tween.play('enemy', { y: '-=50', duration: 500, ease: 'Sine.easeInOut', yoyo: true });
funkin.play.characters.script.execute('dad', 'onAnger'); 

```

> [!NOTE]
> **Guía del Motor de Búsqueda (Selectores) y Uso de la API**
> Todas las funciones de la caja `funkin.play.characters` utilizan el parámetro `identificador`, el cual es extremadamente flexible. Puedes colocar:
> * **Nombre exacto:** `'bf'`, `'dad'`, `'pico'` (Afecta a todos los que compartan ese JSON).
> * **Roles en texto:** `'player'`, `'enemy'`, `'spectator'` (Afecta a todos los personajes en ese bando en lote).
> * **Roles numéricos:** `0`, `1`, `2` (Igual que el anterior: 0=player, 1=enemy, 2=spectator).
> * **Sintaxis estricta:** `'0.bf'`, `'player.bf'`, `'2.dad'` (Busca exactamente a ese personaje dentro de ese bando específico, ideal para cuando hay clones).
> 
> 
> **🟢 Reemplazos e Inserciones Dinámicas**
> * `funkin.play.characters.modify.character('player', 'dad');` Reemplaza masivamente a todos los jugadores actuales por 'Dad'.
> * `funkin.play.characters.add('tankman', 1);` (o usando `'enemy'`) Invoca a Tankman al equipo enemigo de forma asíncrona a mitad de la canción.
> * `funkin.play.characters.set.role('gf', 1);` Convierte a la novia (espectadora) en enemiga, haciendo que las notas del oponente ahora activen sus animaciones.
> 
> 
> **🔵 Modificaciones Visuales y de Posición**
> * `funkin.play.characters.set.alpha('0.bf', 0.5);` Deja a medias tintas al jugador principal.
> * `funkin.play.characters.modify.pos('dad', [0, -50]);` Toma las coordenadas actuales de todos los enemigos llamados 'dad' y los hace levitar 50 píxeles.
> 
> 
> **🟠 Animaciones y Datos**
> * Al usar `.anim.setOffset(...)` cambias permanentemente la compensación de la animación durante la partida. Si notas que una animación choca con el suelo, puedes subirla al instante.
> * Recuerda que `.get.pos()` devuelve la posición pura base (pies/anclaje) sin contar la compensación generada por la animación actual que se esté reproduciendo.
> 
>

> [!NOTE]
> * **El submódulo `.script.execute`:**
> Actualmente está planteado como la futura puerta de enlace para que los personajes tengan comportamientos autónomos ("Hardcoded"). Permitirá que un modchart global le dé órdenes a un script local adjunto a la carpeta del personaje.
> 
>