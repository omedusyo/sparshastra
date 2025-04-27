// ===DOM elements===
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const debugView = document.getElementById('debugView');
const debugTooltip = document.getElementById('debugTooltip');
const brushSizeSlider = document.getElementById('brushSize');
const brushSizeValue = document.getElementById('brushSizeValue');
const brushColor = document.getElementById('brushColor');
const clearButton = document.getElementById('clearCanvas');
const eraserToggle = document.getElementById('eraserToggle');

// ===State===
let state = {
    isDrawing: false,
    lastX: 0,
    lastY: 0,
    bufferImage: null, // Offscreen pixel buffer
    brushSize: CONFIG.DEFAULT_BRUSH_SIZE,
    pendingUpdate: false,
    currentColor: '#000000', // Current brush color.
    isEraser: false, // Whether we're in eraser mode.
    lastPressure: 0.5, // Track the last known pressure value. Useful for end of the brush-stroke.
    isDebugEnabled: true, // Debug view is enabled by default
    // Initialize current brush
    currentBrush: brushes.basic
};

// Message types
const MSG = {
    START_STROKE: 'START_STROKE',
    CONTINUE_STROKE: 'CONTINUE_STROKE',
    END_STROKE: 'END_STROKE',
    CHANGE_BRUSH_SIZE: 'CHANGE_BRUSH_SIZE',
    CHANGE_BRUSH_COLOR: 'CHANGE_BRUSH_COLOR',
    TOGGLE_ERASER: 'TOGGLE_ERASER',
    CLEAR_CANVAS: 'CLEAR_CANVAS',
    CHANGE_BRUSH_TYPE: 'CHANGE_BRUSH_TYPE',
    RESIZE_CANVAS: 'RESIZE_CANVAS',
    FLUSH_STROKE: 'FLUSH_STROKE',
    // === Debug ===
    TOGGLE_DEBUG: 'TOGGLE_DEBUG',
};

// Central dispatch function
function dispatch(msg) {
    // Update state
    state = update(msg, state);
}

// Update function that handles state transitions based on messages
function update(msg, state) {
    switch (msg.tag) {
        case MSG.START_STROKE:
            state.bufferImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
            [state.lastX, state.lastY] = [msg.x, msg.y];
            state.isDrawing = true;
            addDebugCircle(msg.x, msg.y, 'red', 5);
            return state;

        case MSG.CONTINUE_STROKE:
            if (!state.isDrawing) return state;
            
            const currentPressure = msg.pressure === undefined ? 1 : msg.pressure;
            const pressure = currentPressure < CONFIG.PRESSURE_THRESHOLD ? state.lastPressure : currentPressure;
            state.lastPressure = pressure;
            
            if (pressure < CONFIG.PRESSURE_THRESHOLD) return state;
            
            let dx = (msg.x - state.lastX);
            let dy = (msg.y - state.lastY);
            const dist = Math.hypot(dx, dy);
            dx = dx / dist;
            dy = dy / dist;
            
            addDebugCircle(msg.x, msg.y, 'blue', 5);
            
            const adjustedBrushSize = pressure * state.brushSize;
            const spacing = Math.max(1, adjustedBrushSize * 0.50);

            let t = spacing;
            let steps = Math.ceil(dist / spacing);
            for (let i = 0; i < steps; i++) {
                t += spacing;
                let x = state.lastX + dx * t;
                let y = state.lastY + dy * t;
                state.currentBrush.drawDab(x, y, pressure, state.bufferImage, state.currentColor, state.isEraser, state.brushSize);
            }

            drawDebugLine(state.lastX, state.lastY, msg.x, msg.y, steps, pressure);

            [state.lastX, state.lastY] = [msg.x, msg.y];
            
            addDebugCircle(state.lastX, state.lastY, '#cc0000', 5);

            if (!state.pendingUpdate) {
                state.pendingUpdate = true;
                requestAnimationFrame(() => dispatch({ tag: MSG.FLUSH_STROKE }));
            }
            return state;

        case MSG.END_STROKE:
            ctx.putImageData(state.bufferImage, 0, 0);
            state.bufferImage = null;
            state.isDrawing = false;
            return state;

        case MSG.CHANGE_BRUSH_SIZE:
            state.brushSize = msg.size;
            brushSizeValue.textContent = msg.size;
            return state;

        case MSG.CHANGE_BRUSH_COLOR:
            state.currentColor = msg.color;
            return state;

        case MSG.TOGGLE_ERASER:
            state.isEraser = !state.isEraser;
            eraserToggle.textContent = state.isEraser ? 'Brush' : 'Eraser';
            eraserToggle.style.backgroundColor = state.isEraser ? '#ff4444' : '';
            return state;

        case MSG.CLEAR_CANVAS:
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            state.bufferImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
            return state;

        case MSG.TOGGLE_DEBUG:
            state.isDebugEnabled = !state.isDebugEnabled;
            debugContainer.style.display = state.isDebugEnabled ? 'block' : 'none';
            debugToggle.classList.toggle('active', state.isDebugEnabled);
            return state;

        case MSG.CHANGE_BRUSH_TYPE:
            state.currentBrush = brushes[msg.brushType];
            return state;

        case MSG.RESIZE_CANVAS:
            const containerWidth = canvas.parentElement.clientWidth;
            canvas.width = containerWidth;
            canvas.height = 400;
            debugView.setAttribute('width', containerWidth);
            debugView.setAttribute('height', 400);
            return state;

        case MSG.FLUSH_STROKE:
            state.pendingUpdate = false;
            if (state.bufferImage) {
                ctx.putImageData(state.bufferImage, 0, 0);
            }
            return state;

        default:
            console.warn('Unknown message type:', msg.tag);
            return state;
    }
}

// Set canvas and debug view size
function resizeCanvas() {
    const containerWidth = canvas.parentElement.clientWidth;
    canvas.width = containerWidth;
    canvas.height = 400;
    
    // Match debug view dimensions to canvas
    debugView.setAttribute('width', containerWidth);
    debugView.setAttribute('height', 400);
}

// Initial resize
resizeCanvas();

// Resize on window resize
window.addEventListener('resize', () => {
    dispatch({ tag: MSG.RESIZE_CANVAS });
});

// Set up event listeners
canvas.addEventListener('pointerdown', (e) => {
    dispatch({ tag: MSG.START_STROKE, x: e.offsetX, y: e.offsetY });
});

canvas.addEventListener('pointermove', (e) => {
    if (state.isDrawing) {
        dispatch({ 
            tag: MSG.CONTINUE_STROKE, 
            x: e.offsetX, 
            y: e.offsetY,
            pressure: e.pressure
        });
    }
});

canvas.addEventListener('pointerup', () => {
    if (state.isDrawing) {
        dispatch({ tag: MSG.END_STROKE });
    }
});

canvas.addEventListener('pointerout', () => {
    if (state.isDrawing) {
        dispatch({ tag: MSG.END_STROKE });
    }
});

// Update brush size display
brushSizeSlider.addEventListener('input', (e) => {
    dispatch({ tag: MSG.CHANGE_BRUSH_SIZE, size: parseInt(e.target.value) });
});

// Update brush color
brushColor.addEventListener('input', (e) => {
    dispatch({ tag: MSG.CHANGE_BRUSH_COLOR, color: e.target.value });
});

// Toggle eraser mode
eraserToggle.addEventListener('click', () => {
    dispatch({ tag: MSG.TOGGLE_ERASER });
});

// Clear canvas
clearButton.addEventListener('click', () => {
    dispatch({ tag: MSG.CLEAR_CANVAS });
});

// Enable touch events
canvas.style.touchAction = 'none';

// Debug toggle functionality
const debugToggle = document.getElementById('debugToggle');
const debugContainer = document.querySelector('.debug-container');

debugToggle.addEventListener('click', () => {
    dispatch({ tag: MSG.TOGGLE_DEBUG });
});

// Brush selector functionality
const brushSelector = document.getElementById('brushSelector');
brushSelector.addEventListener('change', (e) => {
    dispatch({ tag: MSG.CHANGE_BRUSH_TYPE, brushType: e.target.value });
});

// ===Drawing===
function addDebugCircle(x, y, color, radius = 5) {
    if (!state.isDebugEnabled) return;
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', radius);
    circle.setAttribute('fill', color);
    
    // Add tooltip functionality
    circle.addEventListener('mouseenter', (e) => {
        debugTooltip.textContent = `x: ${Math.round(x)}, y: ${Math.round(y)}`;
        debugTooltip.style.display = 'block';
        debugTooltip.style.left = `${x + 10}px`;
        debugTooltip.style.top = `${y + 10}px`;
    });
    
    circle.addEventListener('mouseleave', () => {
        debugTooltip.style.display = 'none';
    });
    
    debugView.appendChild(circle);
}

function drawDebugLine(x1, y1, x2, y2, steps, pressure) {
    if (!state.isDebugEnabled) return;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', 'green');
    line.setAttribute('stroke-width', '4');
    
    // Add tooltip functionality for steps
    line.addEventListener('mouseenter', () => {
        debugTooltip.textContent = `steps: ${steps}, pressure: ${pressure.toFixed(2)}`;
        debugTooltip.style.display = 'block';
        // Position tooltip at midpoint of line
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        debugTooltip.style.left = `${midX + 10}px`;
        debugTooltip.style.top = `${midY + 10}px`;
    });
    
    line.addEventListener('mouseleave', () => {
        debugTooltip.style.display = 'none';
    });
    
    debugView.appendChild(line);
}

// Keyboard shortcuts mapping
const KEYBINDINGS = {
    'b': 'basic',
    'p': 'pencil',
    's': 'spray',
    'a': 'paper',
    'e': 'eraser',
    'd': 'debug',
    'c': 'clear'
};

// Add keyboard event listener
document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    
    if (KEYBINDINGS[key]) {
        switch (KEYBINDINGS[key]) {
            case 'basic':
            case 'pencil':
            case 'spray':
            case 'paper':
                // Switch to brush
                dispatch({ tag: MSG.CHANGE_BRUSH_TYPE, brushType: KEYBINDINGS[key] });
                // Update brush selector UI
                brushSelector.value = KEYBINDINGS[key];
                break;
                
            case 'eraser':
                // Toggle eraser mode
                dispatch({ tag: MSG.TOGGLE_ERASER });
                break;
                
            case 'debug':
                // Toggle debug view
                dispatch({ tag: MSG.TOGGLE_DEBUG });
                break;
                
            case 'clear':
                // Clear canvas
                dispatch({ tag: MSG.CLEAR_CANVAS });
                break;
        }
    }
});
