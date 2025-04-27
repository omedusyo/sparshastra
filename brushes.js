// Brush abstraction
class Brush {
    constructor() {
        this.name = 'Base Brush';
    }

    drawDab(x, y, pressure, bufferImage, color, isEraser, brushSize) {
        throw new Error('drawDab must be implemented by brush subclasses');
    }
}

class BasicBrush extends Brush {
    constructor() {
        super();
        this.name = 'Basic';
    }

    drawDab(x, y, pressure, bufferImage, color, isEraser, brushSize) {
        if (pressure < CONFIG.PRESSURE_THRESHOLD) { return; }
        const ctxWidth = bufferImage.width;
        const ctxHeight = bufferImage.height;
        const data = bufferImage.data;

        const radius = pressure * brushSize;
        const alpha = pressure;

        // Parse the hex color
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);

        const rSquared = radius * radius;
        const startX = Math.max(0, Math.floor(x - radius));
        const endX = Math.min(ctxWidth - 1, Math.ceil(x + radius));
        const startY = Math.max(0, Math.floor(y - radius));
        const endY = Math.min(ctxHeight - 1, Math.ceil(y + radius));

        for (let j = startY; j <= endY; j++) {
            for (let i = startX; i <= endX; i++) {
                const dx = i - x;
                const dy = j - y;
                const distSquared = dx*dx + dy*dy;
                if (distSquared <= rSquared) {
                    const index = (j * ctxWidth + i) * 4;
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
}

class PencilBrush extends Brush {
    constructor() {
        super();
        this.name = 'Pencil';
    }

    noise(x, y) {
        return Math.random() * CONFIG.PENCIL_NOISE_RANGE + CONFIG.PENCIL_NOISE_BASE;
    }

    drawDab(x, y, pressure, bufferImage, color, isEraser, brushSize) {
        if (pressure < CONFIG.PRESSURE_THRESHOLD) { return; }
        const ctxWidth = bufferImage.width;
        const ctxHeight = bufferImage.height;
        const data = bufferImage.data;

        const radius = pressure * brushSize;
        const baseAlpha = pressure * CONFIG.PENCIL_OPACITY_FACTOR;

        // Parse the hex color
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);

        const rSquared = radius * radius;
        const startX = Math.max(0, Math.floor(x - radius));
        const endX = Math.min(ctxWidth - 1, Math.ceil(x + radius));
        const startY = Math.max(0, Math.floor(y - radius));
        const endY = Math.min(ctxHeight - 1, Math.ceil(y + radius));

        for (let j = startY; j <= endY; j++) {
            for (let i = startX; i <= endX; i++) {
                const dx = i - x;
                const dy = j - y;
                const distSquared = dx*dx + dy*dy;
                
                if (distSquared <= rSquared) {
                    const index = (j * ctxWidth + i) * 4;
                    
                    const dist = Math.sqrt(distSquared) / radius;
                    const edgeFalloff = 1 - (dist * dist);
                    const texture = this.noise(i, j);
                    const localAlpha = baseAlpha * edgeFalloff * texture;

                    const existingAlpha = data[index + 3] / 255;
                    const newAlpha = isEraser ? 0 : Math.min(1, existingAlpha + localAlpha);

                    if (!isEraser) {
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
}

class SprayBrush extends Brush {
    constructor() {
        super();
        this.name = 'Spray';
    }

    drawDab(x, y, pressure, bufferImage, color, isEraser, brushSize) {
        if (pressure < CONFIG.PRESSURE_THRESHOLD) { return; }
        const ctxWidth = bufferImage.width;
        const ctxHeight = bufferImage.height;
        const data = bufferImage.data;

        const radius = pressure * brushSize;
        const baseAlpha = pressure * 0.3; // Spray is naturally more transparent
        const numDots = Math.floor(20 * pressure); // Number of dots scales with pressure

        // Parse the hex color
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);

        for (let i = 0; i < numDots; i++) {
            // Random angle and distance within the radius
            const angle = Math.random() * 2 * Math.PI;
            const distance = Math.random() * radius;
            const dotX = Math.floor(x + Math.cos(angle) * distance);
            const dotY = Math.floor(y + Math.sin(angle) * distance);

            // Skip if outside canvas bounds
            if (dotX < 0 || dotX >= ctxWidth || dotY < 0 || dotY >= ctxHeight) continue;

            const index = (dotY * ctxWidth + dotX) * 4;
            
            // Randomize alpha slightly for each dot
            const localAlpha = baseAlpha * (0.8 + Math.random() * 0.4);

            const existingAlpha = data[index + 3] / 255;
            const newAlpha = isEraser ? 0 : Math.min(1, existingAlpha + localAlpha);

            if (!isEraser) {
                const blendAlpha = localAlpha * (1 - existingAlpha);
                data[index + 0] = Math.floor(r * blendAlpha + data[index + 0] * (1 - blendAlpha));
                data[index + 1] = Math.floor(g * blendAlpha + data[index + 1] * (1 - blendAlpha));
                data[index + 2] = Math.floor(b * blendAlpha + data[index + 2] * (1 - blendAlpha));
            }
            data[index + 3] = Math.floor(newAlpha * 255);
        }
    }
}

// Initialize brushes
const brushes = {
    basic: new BasicBrush(),
    pencil: new PencilBrush(),
    spray: new SprayBrush()
}; 
