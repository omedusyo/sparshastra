// Color palette configuration
const default_colors = [
    '#000000', // Black
    '#FFFFFF', // White
    '#FF0000', // Red
    '#00FF00', // Green
    '#0000FF', // Blue
    '#FFFF00', // Yellow
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#808080', // Gray
    '#800000', // Maroon
    '#008000', // Dark Green
    '#000080', // Navy
];
const PALETTE_CONFIG = {
    DEFAULT_COLORS: default_colors,
    PALETTE_SIZE: default_colors.length,
    SWATCH_SIZE: 30,
    SWATCH_MARGIN: 2
};

class ColorPalette {
    constructor(container, onColorSelect) {
        this.container = container;
        this.onColorSelect = onColorSelect;
        this.colors = [...PALETTE_CONFIG.DEFAULT_COLORS];
        this.selectedColor = this.colors[0];
        this.render();
    }

    render() {
        // Clear container
        this.container.innerHTML = '';
        
        // Create swatches
        this.colors.forEach((color, index) => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = color;
            swatch.style.width = `${PALETTE_CONFIG.SWATCH_SIZE}px`;
            swatch.style.height = `${PALETTE_CONFIG.SWATCH_SIZE}px`;
            swatch.style.margin = `${PALETTE_CONFIG.SWATCH_MARGIN}px`;
            swatch.style.border = '1px solid #ccc';
            swatch.style.cursor = 'pointer';
            swatch.style.display = 'inline-block';
            
            // Add selected state
            if (color === this.selectedColor) {
                swatch.style.border = '2px solid #000';
                swatch.style.boxShadow = '0 0 5px rgba(0,0,0,0.5)';
            }
            
            // Add click handler
            swatch.addEventListener('click', () => {
                this.selectColor(color);
            });
            
            this.container.appendChild(swatch);
        });
    }

    selectColor(color) {
        this.selectedColor = color;
        this.render();
        this.onColorSelect(color);
    }

    addColor(color) {
        if (!this.colors.includes(color)) {
            this.colors.push(color);
            if (this.colors.length > PALETTE_CONFIG.PALETTE_SIZE) {
                this.colors.shift(); // Remove oldest color if palette is full
            }
            this.selectedColor = color;
            this.render();
        }
    }

    getSelectedColor() {
        return this.selectedColor;
    }
} 
