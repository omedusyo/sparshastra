
const canvas = document.getElementById('paintCanvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const brushStyle = document.getElementById('brushStyle');
const undoBtn = document.getElementById('undoBtn');
const saveBtn = document.getElementById('saveBtn');

function resizeCanvas() {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.putImageData(imageData, 0, 0);
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let isDrawing = false;
let lastPoint = null;
let history = [];

function saveHistory() {
  if (history.length > 20) history.shift(); // limit history size
  history.push(canvas.toDataURL());
}

canvas.addEventListener('pointerdown', (e) => {
  isDrawing = true;
  lastPoint = { x: e.clientX, y: e.clientY, pressure: e.pressure || 0.5 };
  saveHistory();
});

canvas.addEventListener('pointermove', (e) => {
  if (!isDrawing) return;

  const currentPoint = {
    x: e.clientX,
    y: e.clientY,
    pressure: e.pressure || 0.5
  };

  ctx.strokeStyle = colorPicker.value;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const brushSize = currentPoint.pressure * 20;
  let opacity = currentPoint.pressure;

  if (brushStyle.value === 'watercolor') {
    opacity *= 0.3; // Watercolor is lighter
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

canvas.addEventListener('pointerup', () => {
  isDrawing = false;
  lastPoint = null;
  ctx.globalAlpha = 1.0;
});

canvas.addEventListener('pointerout', () => {
  isDrawing = false;
  lastPoint = null;
  ctx.globalAlpha = 1.0;
});

undoBtn.addEventListener('click', () => {
  if (history.length > 0) {
    const lastState = history.pop();
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = lastState;
  }
});

saveBtn.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'painting.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});

