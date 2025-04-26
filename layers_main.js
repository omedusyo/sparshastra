
const canvasContainer = document.getElementById('canvasContainer');
const colorPicker = document.getElementById('colorPicker');
const brushStyle = document.getElementById('brushStyle');
const addLayerBtn = document.getElementById('addLayerBtn');
const undoBtn = document.getElementById('undoBtn');
const saveBtn = document.getElementById('saveBtn');
const layerList = document.getElementById('layerList');

let layers = [];
let currentLayerIndex = 0;
let isDrawing = false;
let lastPoint = null;
let history = [];

function createLayer(name = "Layer " + (layers.length + 1)) {
  const canvas = document.createElement('canvas');
  canvas.classList.add('paintLayer');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.zIndex = layers.length; // Stack order

  canvasContainer.appendChild(canvas);

  layers.push({
    canvas,
    ctx: canvas.getContext('2d'),
    name,
    opacity: 1.0,
    visible: true,
    blendMode: 'source-over',
  });
  updateLayerList();
  selectLayer(layers.length - 1);
}

function resizeLayers() {
  layers.forEach(({canvas, ctx}) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.putImageData(imageData, 0, 0);
  });
}
window.addEventListener('resize', resizeLayers);

function updateLayerList() {
  layerList.innerHTML = '';
  layers.forEach((layer, index) => {
    const div = document.createElement('div');
    div.className = 'layerItem' + (index === currentLayerIndex ? ' active' : '');
    div.innerHTML = `
      ${layer.name}
      <select data-action="blendMode" data-index="${index}">
        <option value="source-over" ${layer.blendMode === 'source-over' ? 'selected' : ''}>Normal</option>
        <option value="multiply" ${layer.blendMode === 'multiply' ? 'selected' : ''}>Multiply</option>
        <option value="screen" ${layer.blendMode === 'screen' ? 'selected' : ''}>Screen</option>
        <option value="overlay" ${layer.blendMode === 'overlay' ? 'selected' : ''}>Overlay</option>
        <option value="darken" ${layer.blendMode === 'darken' ? 'selected' : ''}>Darken</option>
        <option value="lighten" ${layer.blendMode === 'lighten' ? 'selected' : ''}>Lighten</option>
        <option value="color-dodge" ${layer.blendMode === 'color-dodge' ? 'selected' : ''}>Color Dodge</option>
        <option value="color-burn" ${layer.blendMode === 'color-burn' ? 'selected' : ''}>Color Burn</option>
      </select>   <input type="range" min="0" max="1" step="0.01" value="${layer.opacity}" data-index="${index}">
      <button data-action="up" data-index="${index}">⬆️</button>
      <button data-action="down" data-index="${index}">⬇️</button>
      <button data-action="toggleVisibility" data-index="${index}">
        ${layer.visible ? '👁️' : '🚫'}
      </button>
      <button data-action="select" data-index="${index}">🎯</button>
    `;
    layerList.appendChild(div);
  });
}

function selectLayer(index) {
  currentLayerIndex = index;
  layers.forEach((layer, i) => {
    layer.canvas.style.pointerEvents = (i === index) ? 'auto' : 'none';
  });
  updateLayerList();
}

function saveHistory() {
  if (history.length > 20) history.shift();
  const {canvas} = layers[currentLayerIndex];
  history.push(canvas.toDataURL());
}

// Drawing
canvasContainer.addEventListener('pointerdown', (e) => {
  isDrawing = true;
  lastPoint = { x: e.clientX, y: e.clientY, pressure: e.pressure || 0.5 };
  saveHistory();
});

canvasContainer.addEventListener('pointermove', (e) => {
  if (!isDrawing) return;

  const {ctx} = layers[currentLayerIndex];
  const currentPoint = { x: e.clientX, y: e.clientY, pressure: e.pressure || 0.5 };

  ctx.strokeStyle = colorPicker.value;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const brushSize = currentPoint.pressure * 20;
  let opacity = currentPoint.pressure;

  if (brushStyle.value === 'watercolor') {
    opacity *= 0.3;
  }

  ctx.lineWidth = brushSize;
  ctx.globalAlpha = opacity;

  ctx.beginPath();
  ctx.moveTo(lastPoint.x, lastPoint.y);
  ctx.quadraticCurveTo(
    (lastPoint.x + currentPoint.x) / 2,
    (lastPoint.y + currentPoint.y) / 2,
    currentPoint.x,
    currentPoint.y
  );
  ctx.stroke();

  lastPoint = currentPoint;
});

canvasContainer.addEventListener('pointerup', () => {
  isDrawing = false;
  lastPoint = null;
  layers[currentLayerIndex].ctx.globalAlpha = 1.0;
});

canvasContainer.addEventListener('pointerout', () => {
  isDrawing = false;
  lastPoint = null;
  layers[currentLayerIndex].ctx.globalAlpha = 1.0;
});

// Layer Panel Actions
layerList.addEventListener('input', (e) => {
  const index = parseInt(e.target.dataset.index);
  if (e.target.type === 'range') {
    const opacity = parseFloat(e.target.value);
    layers[index].opacity = opacity;
    layers[index].canvas.style.opacity = opacity;
  } else if (e.target.tagName === 'SELECT' && e.target.dataset.action === 'blendMode') {
    console.log("WAAAT");
    layers[index].blendMode = e.target.value;
  }
});

layerList.addEventListener('click', (e) => {
  const index = parseInt(e.target.dataset.index);
  if (e.target.dataset.action === 'select') {
    selectLayer(index);
  } else if (e.target.dataset.action === 'up' && index > 0) {
    [layers[index - 1], layers[index]] = [layers[index], layers[index - 1]];
    refreshCanvasOrder();
    selectLayer(index - 1);
  } else if (e.target.dataset.action === 'down' && index < layers.length - 1) {
    [layers[index], layers[index + 1]] = [layers[index + 1], layers[index]];
    refreshCanvasOrder();
    selectLayer(index + 1);
  } else if (e.target.dataset.action === 'toggleVisibility') {
    layers[index].visible = !layers[index].visible;
    layers[index].canvas.style.display = layers[index].visible ? 'block' : 'none';
    updateLayerList();
  }
});

function refreshCanvasOrder() {
  layers.forEach((layer, i) => {
    layer.canvas.style.zIndex = i;
  });
  updateLayerList();
}

// Buttons
addLayerBtn.addEventListener('click', () => {
  createLayer();
});

undoBtn.addEventListener('click', () => {
  if (history.length > 0) {
    const lastState = history.pop();
    const img = new Image();
    img.onload = () => {
      const {ctx, canvas} = layers[currentLayerIndex];
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = lastState;
  }
});

saveBtn.addEventListener('click', () => {
  const mergedCanvas = document.createElement('canvas');
  mergedCanvas.width = window.innerWidth;
  mergedCanvas.height = window.innerHeight;
  const mergedCtx = mergedCanvas.getContext('2d');

  layers.forEach(({canvas}) => {
    mergedCtx.drawImage(canvas, 0, 0);
  });

  const link = document.createElement('a');
  link.download = 'painting_layers.png';
  link.href = mergedCanvas.toDataURL('image/png');
  link.click();
});

// Init
createLayer('Background');


