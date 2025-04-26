const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const brushSizeSlider = document.getElementById('brushSize');
const brushSizeValue = document.getElementById('brushSizeValue');

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Drawing state
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let bufferImage = null; // Offscreen pixel buffer
let brushSize = 10; // Brush size (radius).
let pendingUpdate = false;
let strokeDistance = 0; // How far we've moved since last dab

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

// Update brush size display and base radius
brushSizeSlider.addEventListener('input', (e) => {
    brushSizeValue.textContent = e.target.value;
    brushSize = parseInt(e.target.value);
});

// Enable touch events
canvas.style.touchAction = 'none';

// ===Drawing===
function startStroke(e) {
    bufferImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
    [lastX, lastY] = [e.offsetX, e.offsetY];
    isDrawing = true;
}

// Smoothing.
// We need to do interpolation
function continueStroke(e) {
    const pressure = e.pressure || 0.5; // fallback if no pressure support
    // ==Interpolation==
    let dx = (e.offsetX - lastX);
    let dy = (e.offsetY - lastY);
    const dist = Math.hypot(dx, dy);
    dx = dx / dist;
    dy = dy / dist;
    
    const adjustedBrushSize = pressure * brushSize; // Pressure controls brush size
    const spacing = adjustedBrushSize * 0.2; // Spacing is 20% of brush size (tweakable)
    let t = 0;
    let steps = Math.floor((strokeDistance + dist) / spacing);
    console.log(steps)
    for (let i = 0; i < steps; i++) {
        t += spacing;
        drawDab(e.offsetX + dx * t, e.offsetY + dy * t, pressure);
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
// TODO: Add color.
function drawDab(x, y, pressure) {
    const ctxWidth = bufferImage.width;
    const ctxHeight = bufferImage.height;
    // bufferImage is a pixel array where you directly control alpha.
    // data is an array [R,G,B,A, R,G,B,A, ...]
    const data = bufferImage.data;

    const radius = pressure * brushSize; // brush size based on pressure and base radius
    const alpha = pressure;       // opacity based on pressure

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
                const newAlpha = Math.max(existingAlpha, localAlpha);

                data[index + 0] = 0; // black brush (R)
                data[index + 1] = 0; // (G)
                data[index + 2] = 0; // (B)
                data[index + 3] = Math.floor(newAlpha * 255); // (A)
            }
        }
    }
}
