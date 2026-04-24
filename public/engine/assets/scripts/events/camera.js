/**
 * @file camera.js
 * @description Script de cámara para Genesis Engine invocado por events.json.
 */

function executeEvent(eventData) {
    // 1. ZOOM
    if (eventData.zoom) {
        const z = eventData.zoom;
        Camera.zoom(
            z.amount || 1.0, 
            z.duration || 0, 
            true, 
            z.ease || 'Linear', 
            z.target || 'game'
        );
    }

    // 2. SCROLL (FocusCamera)
    if (eventData.scroll) {
        const scr = eventData.scroll;
        const offsets = { x: scr.offsetX || 0, y: scr.offsetY || 0, useDPI: true };
        Camera.follow(
            scr.target, // Ahora la API invierte automáticamente esto por debajo
            scr.duration || 0, 
            true, 
            scr.ease || 'Linear', 
            offsets, 
            scr.camera || 'game'
        );
    }

    // 3. BOOPING (Latido rítmico de cámara)
    if (eventData.booping) {
        const bop = eventData.booping;
        const enabled = bop.intensity > 0;
        Camera.setBooping(
            enabled, 
            bop.beats || 4, // El intervalo en beats
            bop.intensity || 0.015, 
            'all'
        );
    }
}