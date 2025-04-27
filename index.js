const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const debugView = document.getElementById('debugView');
const debugTooltip = document.getElementById('debugTooltip');
const brushSizeSlider = document.getElementById('brushSize');
const brushSizeValue = document.getElementById('brushSizeValue');
const brushColor = document.getElementById('brushColor');
const clearButton = document.getElementById('clearCanvas');
const eraserToggle = document.getElementById('eraserToggle');

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

// Drawing state
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let bufferImage = null; // Offscreen pixel buffer
let brushSize = CONFIG.DEFAULT_BRUSH_SIZE; // Brush size (radius).
let pendingUpdate = false;
let currentColor = '#000000'; // Current brush color
let isEraser = false; // Whether we're in eraser mode
let lastPressure = 0.5; // Track the last known pressure value
const PRESSURE_THRESHOLD = CONFIG.PRESSURE_THRESHOLD; // Consider pressure effectively 0 below this value
let isDebugEnabled = true; // Debug view is enabled by default

// Initialize current brush
let currentBrush = brushes.basic;

// Set up event listeners
canvas.addEventListener('pointerdown', (e) => {
    startStroke(e);
});

canvas.addEventListener('pointermove', (e) => {
    if (isDrawing) { continueStroke(e); }
});

canvas.addEventListener('pointerup', (e) => {
    if (isDrawing) { endStroke(); }
});

canvas.addEventListener('pointerout', (e) => {
    if (isDrawing) { endStroke(); }
});

// Update brush size display
brushSizeSlider.addEventListener('input', (e) => {
    brushSizeValue.textContent = e.target.value;
    brushSize = parseInt(e.target.value);
});

// Update brush color
brushColor.addEventListener('input', (e) => {
    currentColor = e.target.value;
});

// Toggle eraser mode
eraserToggle.addEventListener('click', () => {
    isEraser = !isEraser;
    eraserToggle.textContent = isEraser ? 'Brush' : 'Eraser';
    eraserToggle.style.backgroundColor = isEraser ? '#ff4444' : '';
});

// Clear canvas
clearButton.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    bufferImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
});

// Enable touch events
canvas.style.touchAction = 'none';

// Debug toggle functionality
const debugToggle = document.getElementById('debugToggle');
const debugContainer = document.querySelector('.debug-container');

debugToggle.addEventListener('click', () => {
    isDebugEnabled = !isDebugEnabled;
    debugContainer.style.display = isDebugEnabled ? 'block' : 'none';
    debugToggle.classList.toggle('active', isDebugEnabled);
});

// Brush selector functionality
const brushSelector = document.getElementById('brushSelector');
brushSelector.addEventListener('change', (e) => {
    currentBrush = brushes[e.target.value];
});

// ===Drawing===
function addDebugCircle(x, y, color, radius = 5) {
    if (!isDebugEnabled) return;
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
    bufferImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
    [lastX, lastY] = [e.offsetX, e.offsetY];
    isDrawing = true;

    addDebugCircle(e.offsetX, e.offsetY, 'red', 5);
}

function drawDebugLine(x1, y1, x2, y2, steps, pressure) {
    if (!isDebugEnabled) return;
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
    const pressure = currentPressure < PRESSURE_THRESHOLD ? lastPressure : currentPressure;
    lastPressure = pressure; // Update last known pressure
    
    if (pressure < PRESSURE_THRESHOLD) { return; }
    
    // ==Interpolation==
    let dx = (e.offsetX - lastX);
    let dy = (e.offsetY - lastY);
    const dist = Math.hypot(dx, dy);
    dx = dx / dist;
    dy = dy / dist;
    
    addDebugCircle(e.offsetX, e.offsetY, 'blue', 5);
    const adjustedBrushSize = pressure * brushSize;
    const spacing = Math.max(1, adjustedBrushSize * 0.50);

    let t = spacing;
    let steps = Math.ceil(dist / spacing);
    for (let i = 0; i < steps; i++) {
        t += spacing;
        let x = lastX + dx * t;
        let y = lastY + dy * t;
        currentBrush.drawDab(x, y, pressure, bufferImage, currentColor, isEraser);
    }

    drawDebugLine(lastX, lastY, e.offsetX, e.offsetY, steps, pressure);

    [lastX, lastY] = [e.offsetX, e.offsetY];
    addDebugCircle(lastX, lastY, '#cc0000', 5);

    if (!pendingUpdate) {
        pendingUpdate = true;
        requestAnimationFrame(flushStroke);
    }
}

function flushStroke() {
    pendingUpdate = false;
    // Clear visible canvas
    // TODO: Do we really need this?
    // ctx.clearRect(0, 0, ctx.width, ctx.height);
    // Draw buffer
    if (bufferImage) {
        ctx.putImageData(bufferImage, 0, 0);
    }
}

function endStroke() {
    ctx.putImageData(bufferImage, 0, 0);
    bufferImage = null;
    isDrawing = false;
}
