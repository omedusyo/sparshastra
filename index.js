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
const state = {
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
window.addEventListener('resize', resizeCanvas);

// Set up event listeners
canvas.addEventListener('pointerdown', (e) => {
    startStroke(e);
});

canvas.addEventListener('pointermove', (e) => {
    if (state.isDrawing) { continueStroke(e); }
});

canvas.addEventListener('pointerup', (e) => {
    if (state.isDrawing) { endStroke(); }
});

canvas.addEventListener('pointerout', (e) => {
    if (state.isDrawing) { endStroke(); }
});

// Update brush size display
brushSizeSlider.addEventListener('input', (e) => {
    brushSizeValue.textContent = e.target.value;
    state.brushSize = parseInt(e.target.value);
});

// Update brush color
brushColor.addEventListener('input', (e) => {
    state.currentColor = e.target.value;
});

// Toggle eraser mode
eraserToggle.addEventListener('click', () => {
    state.isEraser = !state.isEraser;
    eraserToggle.textContent = state.isEraser ? 'Brush' : 'Eraser';
    eraserToggle.style.backgroundColor = state.isEraser ? '#ff4444' : '';
});

// Clear canvas
clearButton.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    state.bufferImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
});

// Enable touch events
canvas.style.touchAction = 'none';

// Debug toggle functionality
const debugToggle = document.getElementById('debugToggle');
const debugContainer = document.querySelector('.debug-container');

debugToggle.addEventListener('click', () => {
    state.isDebugEnabled = !state.isDebugEnabled;
    debugContainer.style.display = state.isDebugEnabled ? 'block' : 'none';
    debugToggle.classList.toggle('active', state.isDebugEnabled);
});

// Brush selector functionality
const brushSelector = document.getElementById('brushSelector');
brushSelector.addEventListener('change', (e) => {
    state.currentBrush = brushes[e.target.value];
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

function startStroke(e) {
    state.bufferImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
    [state.lastX, state.lastY] = [e.offsetX, e.offsetY];
    state.isDrawing = true;

    addDebugCircle(e.offsetX, e.offsetY, 'red', 5);
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

// Smoothing/Interpolation.
function continueStroke(e) {
    // Use last known pressure if current pressure is below threshold
    const currentPressure = e.pressure === undefined ? 1 : e.pressure;
    const pressure = currentPressure < CONFIG.PRESSURE_THRESHOLD ? state.lastPressure : currentPressure;
    state.lastPressure = pressure; // Update last known pressure
    
    if (pressure < CONFIG.PRESSURE_THRESHOLD) { return; }
    
    // ==Interpolation==
    let dx = (e.offsetX - state.lastX);
    let dy = (e.offsetY - state.lastY);
    const dist = Math.hypot(dx, dy);
    dx = dx / dist;
    dy = dy / dist;
    
    addDebugCircle(e.offsetX, e.offsetY, 'blue', 5);
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

    drawDebugLine(state.lastX, state.lastY, e.offsetX, e.offsetY, steps, pressure);

    [state.lastX, state.lastY] = [e.offsetX, e.offsetY];
    addDebugCircle(state.lastX, state.lastY, '#cc0000', 5);

    if (!state.pendingUpdate) {
        state.pendingUpdate = true;
        requestAnimationFrame(flushStroke);
    }
}

function flushStroke() {
    state.pendingUpdate = false;
    // Clear visible canvas
    // TODO: Do we really need this?
    // ctx.clearRect(0, 0, ctx.width, ctx.height);
    // Draw buffer
    if (state.bufferImage) {
        ctx.putImageData(state.bufferImage, 0, 0);
    }
}

function endStroke() {
    ctx.putImageData(state.bufferImage, 0, 0);
    state.bufferImage = null;
    state.isDrawing = false;
}
