# Interactive Content Editor

A modern, web-based content editor that allows you to add images, create text elements, and easily move and interact with content on a canvas.

## Features

- ✨ **Add Text Elements** - Click the "Text" button to add editable text boxes
- 🖼️ **Add Images** - Upload images by clicking the "Image" button or drag & drop images onto the canvas
- 🖱️ **Drag & Drop** - Click and drag any element to move it around the canvas
- 📏 **Resize Images** - Use the corner handles to resize image elements
- ✏️ **Edit Text** - Double-click any text element to edit its content
- 🎨 **Customize Properties** - Select any element to edit its properties in the right panel
- ⌨️ **Keyboard Shortcuts**:
  - `Delete` or `Backspace` - Delete selected element
  - `Escape` - Deselect all elements
- 💾 **Export** - Download your canvas as a PNG image

## How to Use

1. **Open the app**: Simply open `index.html` in a modern web browser
2. **Add content**: 
   - Click "Text" to add a text element
   - Click "Image" to upload an image file
   - Or drag and drop image files directly onto the canvas
3. **Edit text**: Double-click any text element to edit its content
4. **Move elements**: Click and drag any element to reposition it
5. **Resize images**: Click and drag the corner handles on image elements
6. **Customize**: Select an element to see its properties panel on the right
7. **Delete**: Select an element and click "Delete" or press Delete/Backspace
8. **Export**: Click "Download" to save your canvas as an image

## Properties Panel

When you select an element, you can edit:

**For Text Elements:**
- Text content
- Font size (12-72px)
- Text color
- Font weight (Normal/Bold)
- Text alignment (Left/Center/Right)
- Position (X, Y coordinates)

**For Image Elements:**
- Width and height
- Position (X, Y coordinates)

## Technical Details

- Pure HTML, CSS, and JavaScript (no dependencies)
- Works in all modern browsers
- Responsive design with a beautiful gradient background
- Canvas-based editing with grid background for alignment

## Files

- `index.html` - Main HTML structure
- `styles.css` - Styling and layout
- `app.js` - Core functionality and interactions
