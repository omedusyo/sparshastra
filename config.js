// Drawing configuration
const DRAWING_CONFIG = {
    // Pressure sensitivity
    PRESSURE_THRESHOLD: 0.1,
    DEFAULT_PRESSURE: 0.5,
    MAX_PRESSURE: 1.0,

    // Brush settings
    DEFAULT_BRUSH_SIZE: 10,
    MIN_BRUSH_SIZE: 1,
    MAX_BRUSH_SIZE: 50,
    DEFAULT_COLOR: '#000000',

    // Pencil brush settings
    PENCIL_NOISE_RANGE: 0.2,
    PENCIL_NOISE_BASE: 0.9,
    PENCIL_OPACITY_FACTOR: 0.8,

    // Debug settings
    DEBUG_ENABLED_BY_DEFAULT: true
};

// Export the configuration
window.CONFIG = DRAWING_CONFIG; 