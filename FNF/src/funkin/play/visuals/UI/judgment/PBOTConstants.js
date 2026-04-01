/**
 * @file src/funkin/play/data/playScene/PBOTConstants.js
 * Reglas maestras del motor matemático PBOT para la ganancia/pérdida de vida.
 */

window.funkin = window.funkin || {};

funkin.PBOT = {
    Constants: {
        // Límites base
        HEALTH_STARTING: 1.0,
        HEALTH_MAX: 2.0,
        HEALTH_MIN: 0.0,

        // Ganancias por notas regulares (Judgments)
        HEALTH_SICK_BONUS: 0.04,
        HEALTH_GOOD_BONUS: 0.02,
        HEALTH_BAD_BONUS: 0.0,
        HEALTH_SHIT_BONUS: -0.05, // Shit resta vida en la mayoría de motores hardcore

        // Penalizaciones directas
        HEALTH_MISS_PENALTY: 0.0475,
        HEALTH_GHOST_MISS_PENALTY: 0.04,

        // Mecánicas de Hold (Notas largas)
        HEALTH_HOLD_BONUS_PER_SECOND: 0.01,
        HEALTH_HOLD_DROP_PENALTY_PER_SECOND: 0.05,
        HOLD_DROP_PENALTY_THRESHOLD_MS: 200, // Tiempo mínimo que debió durar para aplicar penalización
        HEALTH_HOLD_DROP_PENALTY_MAX: 0.2,   // Tope máximo de castigo

        // Colores Hexadecimales puros para la UI
        COLOR_HEALTH_BAR_RED: 0xFFFF0000,
        COLOR_HEALTH_BAR_GREEN: 0xFF00FF00
    }
};