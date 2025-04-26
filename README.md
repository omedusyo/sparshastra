# Ultimate Pen Pressure Painter

A sophisticated web-based digital painting application that supports pen pressure sensitivity and multi-layer drawing capabilities.

## Features

### Drawing Tools
- **Pen Pressure Support**: Automatically adjusts brush size and opacity based on pen pressure when using a compatible stylus/tablet
- **Multiple Brush Styles**:
  - Normal brush
  - Watercolor effect
- **Color Picker**: Choose any color for your brush strokes
- **Undo Functionality**: Revert your last action
- **Advanced Blending Modes**: 
  - Supports various Photoshop-like blending modes (Multiply, Screen, Overlay, etc.)
  - Implemented using a sophisticated multi-layer compositing system
  - Each stroke is drawn on a hidden layer and automatically composited with the visible layer
  - Real-time blending calculations ensure smooth performance
  - Perfect for creating complex digital art effects

### Layer System
- **Multi-layer Support**: Create and manage multiple drawing layers
- **Layer Properties**:
  - Customizable layer names
  - Adjustable opacity
  - Visibility toggle
  - Blend modes
- **Layer Management**: Add, select, and organize layers

### User Interface
- **Responsive Design**: Full-screen canvas that adapts to window size
- **Floating Control Panel**: Easy access to tools and settings
- **Touch Support**: Works with touch devices and stylus input
- **Modern UI**: Clean, intuitive interface with smooth interactions

## Usage

1. **Drawing**:
   - Use your mouse, touch device, or pressure-sensitive stylus to draw
   - Select your desired color using the color picker
   - Choose between different brush styles
   - Use the undo button to revert changes

2. **Layer Management**:
   - Create new layers for complex compositions
   - Adjust layer opacity and visibility
   - Use blend modes for creative effects
   - Organize your artwork across multiple layers

3. **Saving**:
   - Use the save button to export your artwork

## Technical Details

- Pure vanilla JavaScript implementation - no external libraries or frameworks
- Built with native HTML5 Canvas API
- Custom layer management and compositing system
- Responsive design for various screen sizes
- Touch and pen pressure support using native browser APIs
- Modern UI with pure CSS3 styling

## Browser Support

Works best in modern browsers that support:
- HTML5 Canvas
- CSS3
- Touch events
- Pointer events (for pen pressure support) 
