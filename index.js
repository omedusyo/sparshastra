const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const debugView = document.getElementById('debugView');
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
let brushSize = 10; // Brush size (radius).
let pendingUpdate = false;
let strokeDistance = 0; // How far we've moved since last dab
let currentColor = '#000000'; // Current brush color
let isEraser = false; // Whether we're in eraser mode

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

// ===Drawing===
function startStroke(e) {
    bufferImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
    [lastX, lastY] = [e.offsetX, e.offsetY];
    isDrawing = true;
}

// Smoothing/Interpolation.
function continueStroke(e) {
    const pressure = e.pressure || 0.5; // fallback if no pressure support
    // ==Interpolation==
    let dx = (e.offsetX - lastX);
    let dy = (e.offsetY - lastY);
    const dist = Math.hypot(dx, dy);
    dx = dx / dist;
    dy = dy / dist;
    
    const adjustedBrushSize = pressure * brushSize; // Pressure controls brush size
    const spacing = adjustedBrushSize * 0.10; // Spacing is 10% of brush size (tweakable)
    const jitterAmount = brushSize * 0.00; // 5% of brush size (tweakable)

    let t = 0;
    let steps = Math.floor((strokeDistance + dist) / spacing);
    console.log(steps)
    for (let i = 0; i < steps; i++) {
        t += spacing;
        let x = e.offsetX + dx * t;
        let y = e.offsetY + dy * t;
        // ✨ Apply random jitter here!
        x += (Math.random() * 2 - 1) * jitterAmount;
        y += (Math.random() * 2 - 1) * jitterAmount;
        drawDab(x, y, pressure);
    }

    strokeDistance = (strokeDistance + dist) - (steps * spacing);
    [lastX, lastY] = [e.offsetX, e.offsetY];

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

// Draws a circle of opacity
//  but instead of adding opacities, it uses max
function drawDab(x, y, pressure) {
    const ctxWidth = bufferImage.width;
    const ctxHeight = bufferImage.height;
    // bufferImage is a pixel array where you directly control alpha.
    // data is an array [R,G,B,A, R,G,B,A, ...]
    const data = bufferImage.data;

    const radius = pressure * brushSize; // brush size based on pressure and base radius
    const alpha = pressure;       // opacity based on pressure

    // Parse the hex color
    const r = parseInt(currentColor.slice(1, 3), 16);
    const g = parseInt(currentColor.slice(3, 5), 16);
    const b = parseInt(currentColor.slice(5, 7), 16);

    // This calculates a small rectangle around (x, y)
    const rSquared = radius * radius;
    const startX = Math.max(0, Math.floor(x - radius));
    const endX = Math.min(ctxWidth - 1, Math.ceil(x + radius));
    const startY = Math.max(0, Math.floor(y - radius));
    const endY = Math.min(ctxHeight - 1, Math.ceil(y + radius));

    for (let j = startY; j <= endY; j++) {
        for (let i = startX; i <= endX; i++) {
            // note that (i, j) is a pixel inside the recntagle)
            // find the distance of the pixel (i, j)
            const dx = i - x;
            const dy = j - y;
            const distSquared = dx*dx + dy*dy;
            if (distSquared <= rSquared) {
                // Now (i, j) is inside the circle
                
                // This transforms (i, j) ~> index into the data array.
                const index = (j * ctxWidth + i) * 4;
                
                // Simple falloff (optional)
                // const dist = Math.sqrt(distSquared);
                // const localAlpha = alpha * (1 - dist / radius);
                const localAlpha = alpha;

                // Compute new alpha
                const existingAlpha = data[index + 3] / 255;
                const newAlpha = isEraser ? 0 : Math.max(existingAlpha, localAlpha);

                if (!isEraser) {
                    // Blend the new color with existing color based on alpha
                    const blendAlpha = localAlpha * (1 - existingAlpha);
                    data[index + 0] = Math.floor(r * blendAlpha + data[index + 0] * (1 - blendAlpha));
                    data[index + 1] = Math.floor(g * blendAlpha + data[index + 1] * (1 - blendAlpha));
                    data[index + 2] = Math.floor(b * blendAlpha + data[index + 2] * (1 - blendAlpha));
                }
                data[index + 3] = Math.floor(newAlpha * 255);
            }
        }
    }
}
