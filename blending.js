const displayCanvas = document.getElementById('displayCanvas');
const displayCtx = displayCanvas.getContext('2d');
displayCanvas.width = window.innerWidth;
displayCanvas.height = window.innerHeight;

// Setup layers array (hidden canvases)
const layers = [];

// Utility to create a new layer
function createLayer(name) {
  const canvas = document.createElement('canvas');
  canvas.width = displayCanvas.width;
  canvas.height = displayCanvas.height;
  const ctx = canvas.getContext('2d');
  
  const layer = {
    name,
    canvas,
    ctx,
    opacity: 1.0,
    blendMode: 'source-over',
    visible: true
  };
  layers.push(layer);
  return layer;
}

// Create two example layers
const backgroundLayer = createLayer('Background');
const drawLayer = createLayer('Drawing');

// Example: draw something on the background
backgroundLayer.ctx.fillStyle = 'lightblue';
backgroundLayer.ctx.fillRect(100, 100, 400, 400);

// Example: draw something on the drawing layer
drawLayer.ctx.fillStyle = 'red';
drawLayer.ctx.beginPath();
drawLayer.ctx.arc(300, 300, 100, 0, Math.PI * 2);
drawLayer.ctx.fill();

// Function to redraw the display canvas
function redrawDisplayCanvas() {
  displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);

  layers.forEach(layer => {
    if (!layer.visible) return;
    
    displayCtx.globalAlpha = layer.opacity;
    displayCtx.globalCompositeOperation = layer.blendMode;
    displayCtx.drawImage(layer.canvas, 0, 0);
  });

  // Reset to normal after drawing
  displayCtx.globalAlpha = 1.0;
  displayCtx.globalCompositeOperation = 'source-over';
}

// Redraw once at start
redrawDisplayCanvas();


// ===Drawing===
let isDrawing = false;
let lastX = 0;
let lastY = 0;

// Set the "current layer" to draw on
let currentLayer = drawLayer;  // (default to the drawing layer)


// Listen for mouse/pointer events
displayCanvas.addEventListener('pointerdown', (e) => {
  isDrawing = true;
  const rect = displayCanvas.getBoundingClientRect();
  lastX = e.clientX - rect.left;
  lastY = e.clientY - rect.top;
});

displayCanvas.addEventListener('pointermove', (e) => {
  if (!isDrawing) return;
  
  const rect = displayCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  const ctx = currentLayer.ctx;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'black';  // Set your stroke color
  
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(x, y);
  ctx.stroke();
  
  lastX = x;
  lastY = y;
  
  redrawDisplayCanvas();  // Refresh screen
});

displayCanvas.addEventListener('pointerup', () => {
  isDrawing = false;
});

displayCanvas.addEventListener('pointerout', () => {
  isDrawing = false;
});



// ===Layer Selection===
const layerSelect = document.getElementById('layerSelect');
const blendModeSelect = document.getElementById('blendModeSelect');

function updateLayerSelect() {
  layerSelect.innerHTML = '';
  layers.forEach((layer, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = layer.name;
    layerSelect.appendChild(option);
  });
}
updateLayerSelect();
layerSelect.addEventListener('change', (e) => {
  const index = parseInt(e.target.value);
  currentLayer = layers[index];

  // Update blend mode selector to match the new layer
  blendModeSelect.value = currentLayer.blendMode;
});
blendModeSelect.addEventListener('change', (e) => {
  currentLayer.blendMode = e.target.value;
  redrawDisplayCanvas();  // Refresh after changing blend mode
});

