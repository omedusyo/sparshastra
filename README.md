# Sparshastra

Vibe-coding hard!

*The science of touch-sensitive digital art*

Sparshastra is a sophisticated drawing application that combines pressure-sensitive brush strokes with real-time debugging visualization. The name combines "Sparsha" (touch) and "Shastra" (science/knowledge) from Sanskrit, reflecting our commitment to both artistic expression and technical precision.

## Features

### Artistic Tools
- Pressure-sensitive brush strokes
- Customizable brush sizes
- Color selection
- Layer management
- Eraser tool

### Debug Visualization
- Real-time stroke path visualization
- Pressure data display
- Interpolation point tracking
- Visual feedback for:
  - Stroke start points (red circles)
  - Stroke end points (dark red circles)
  - Interpolated points (blue circles)
  - Movement paths (green lines)
  - Pressure values and interpolation steps (on hover)

## Getting Started

1. Clone the repository
2. Open `index.html` in your browser
3. Connect your pressure-sensitive device (e.g., drawing tablet)
4. Start drawing!

## Technical Details

Sparshastra uses:
- HTML5 Canvas for drawing
- SVG for debug visualization
- Pointer Events API for pressure sensitivity
- Custom interpolation for smooth strokes

## Debug Mode

The debug view provides insights into how Sparshastra processes your strokes:
- Red circles: Stroke start points
- Blue circles: Current positions
- Dark red circles: Stroke end points
- Green lines: Movement paths
- Hover over elements to see detailed information:
  - Coordinates for points
  - Pressure values
  - Interpolation steps