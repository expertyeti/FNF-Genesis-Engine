/**
 * @file PBOTConstants.js
 * Reglas maestras del motor matemático PBOT para la ganancia/pérdida de vida.
 */


funkin.PBOT = {
    Constants: {
        HEALTH_STARTING: 1.0,
        HEALTH_MAX: 2.0,
        HEALTH_MIN: 0.0,

        HEALTH_SICK_BONUS: 0.04,
        HEALTH_GOOD_BONUS: 0.02,
        HEALTH_BAD_BONUS: 0.0,
        HEALTH_SHIT_BONUS: -0.05, 

        HEALTH_MISS_PENALTY: 0.0475,
        HEALTH_GHOST_MISS_PENALTY: 0.04,

        HEALTH_HOLD_BONUS_PER_SECOND: 0.01,
        HEALTH_HOLD_DROP_PENALTY_PER_SECOND: 0.05,
        HOLD_DROP_PENALTY_THRESHOLD_MS: 200, 
        HEALTH_HOLD_DROP_PENALTY_MAX: 0.2,   

        COLOR_HEALTH_BAR_RED: 0xFFFF0000,
        COLOR_HEALTH_BAR_GREEN: 0xFF00FF00
    }
};