
**funkin.play.uiSkins:**
Se encarga del JSON visual (Skin) configurado en el chart y precarga sus recursos.

* `.loadSkinData()`: Carga el archivo JSON en la memoria.
* `.preloadSkinAssets(scene)`: Precarga las imágenes o audios basados en el JSON cargado.
* `.get('ruta')`: Permite buscar qué imágenes usar para elementos como las flechas o el combo.
* `.setOverrideSkin('nombre')`: Fuerza el cambio de apariencia de la UI en medio del juego, reemplazando flechas y pop-ups instantáneamente.
* `.reloadActiveSkin()`: Refresca las texturas en caliente sin reiniciar la escena.

```javascript
funkin.play.uiSkins.loadSkinData();
funkin.play.uiSkins.preloadSkinAssets(scene);
funkin.play.uiSkins.get('gameplay.strumline');
funkin.play.uiSkins.setOverrideSkin('PixelUI');
funkin.play.uiSkins.reloadActiveSkin();

```