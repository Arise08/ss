class ContentEditor {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.selectedElement = null;
        this.elements = [];
        this.elementIdCounter = 0;
        this.isDragging = false;
        this.isResizing = false;
        this.dragOffset = { x: 0, y: 0 };
        this.resizeStart = { x: 0, y: 0, width: 0, height: 0 };
        this.resizeHandle = null;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupCanvas();
    }

    setupEventListeners() {
        // Toolbar buttons
        document.getElementById('addTextBtn').addEventListener('click', () => this.addTextElement());
        document.getElementById('addImageBtn').addEventListener('click', () => document.getElementById('imageInput').click());
        document.getElementById('imageInput').addEventListener('change', (e) => this.handleImageUpload(e));
        document.getElementById('deleteBtn').addEventListener('click', () => this.deleteSelected());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearCanvas());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadCanvas());

        // Canvas click to deselect
        this.canvas.addEventListener('click', (e) => {
            if (e.target === this.canvas || e.target.classList.contains('canvas-grid')) {
                this.deselectAll();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (this.selectedElement && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                    this.deleteSelected();
                }
            }
            if (e.key === 'Escape') {
                this.deselectAll();
            }
        });
    }

    setupCanvas() {
        // Make canvas droppable
        this.canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        this.canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('image/')) {
                this.loadImageFile(files[0]);
            }
        });
    }

    addTextElement(text = 'Double click to edit') {
        const element = document.createElement('div');
        element.className = 'canvas-element text-element';
        element.id = `element-${this.elementIdCounter++}`;
        element.contentEditable = true;
        element.textContent = text;
        
        // Position in center of visible canvas
        const rect = this.canvas.getBoundingClientRect();
        element.style.left = `${rect.width / 2 - 75}px`;
        element.style.top = `${rect.height / 2 - 25}px`;
        element.style.width = '150px';
        element.style.minHeight = '50px';

        this.setupElement(element, 'text');
        this.canvas.appendChild(element);
        this.selectElement(element);
        
        // Focus and select text
        setTimeout(() => {
            element.focus();
            const range = document.createRange();
            range.selectNodeContents(element);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }, 100);
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            this.loadImageFile(file);
        }
        // Reset input
        event.target.value = '';
    }

    loadImageFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.addImageElement(e.target.result);
        };
        reader.readAsDataURL(file);
    }

    addImageElement(src) {
        const container = document.createElement('div');
        container.className = 'canvas-element image-element';
        container.id = `element-${this.elementIdCounter++}`;
        
        const img = document.createElement('img');
        img.src = src;
        img.draggable = false;
        
        container.appendChild(img);
        
        // Position in center of visible canvas
        const rect = this.canvas.getBoundingClientRect();
        container.style.left = `${rect.width / 2 - 100}px`;
        container.style.top = `${rect.height / 2 - 100}px`;
        container.style.width = '200px';
        container.style.height = '200px';

        // Wait for image to load to set proper dimensions
        img.onload = () => {
            const aspectRatio = img.naturalWidth / img.naturalHeight;
            if (aspectRatio > 1) {
                container.style.width = '300px';
                container.style.height = `${300 / aspectRatio}px`;
            } else {
                container.style.height = '300px';
                container.style.width = `${300 * aspectRatio}px`;
            }
        };

        this.setupElement(container, 'image');
        this.canvas.appendChild(container);
        this.selectElement(container);
    }

    setupElement(element, type) {
        this.elements.push(element);

        // Click to select
        element.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('resize-handle')) {
                return;
            }
            e.stopPropagation();
            this.selectElement(element);
            
            // Start dragging
            if (type === 'image' || (type === 'text' && !element.isContentEditable)) {
                this.startDragging(e, element);
            }
        });

        // Double click to edit text
        if (type === 'text') {
            element.addEventListener('dblclick', () => {
                element.contentEditable = true;
                element.focus();
            });

            element.addEventListener('blur', () => {
                element.contentEditable = false;
                if (!element.textContent.trim()) {
                    element.textContent = 'Double click to edit';
                }
            });

            element.addEventListener('input', () => {
                this.updateProperties();
            });
        }

        // Add resize handles for images
        if (type === 'image') {
            this.addResizeHandles(element);
        }
    }

    addResizeHandles(element) {
        const handles = ['nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e'];
        handles.forEach(handle => {
            const handleEl = document.createElement('div');
            handleEl.className = `resize-handle ${handle}`;
            element.appendChild(handleEl);

            handleEl.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                this.startResizing(e, element, handle);
            });
        });
    }

    startDragging(e, element) {
        this.isDragging = true;
        element.classList.add('dragging');
        
        const rect = element.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();
        
        this.dragOffset = {
            x: e.clientX - rect.left - canvasRect.left + this.canvas.scrollLeft,
            y: e.clientY - rect.top - canvasRect.top + this.canvas.scrollTop
        };

        document.addEventListener('mousemove', this.handleDrag);
        document.addEventListener('mouseup', this.stopDragging);
    }

    handleDrag = (e) => {
        if (!this.isDragging || !this.selectedElement) return;

        const canvasRect = this.canvas.getBoundingClientRect();
        const x = e.clientX - canvasRect.left + this.canvas.scrollLeft - this.dragOffset.x;
        const y = e.clientY - canvasRect.top + this.canvas.scrollTop - this.dragOffset.y;

        this.selectedElement.style.left = `${Math.max(0, x)}px`;
        this.selectedElement.style.top = `${Math.max(0, y)}px`;
    }

    stopDragging = () => {
        if (this.selectedElement) {
            this.selectedElement.classList.remove('dragging');
        }
        this.isDragging = false;
        document.removeEventListener('mousemove', this.handleDrag);
        document.removeEventListener('mouseup', this.stopDragging);
    }

    startResizing(e, element, handle) {
        this.isResizing = true;
        this.resizeHandle = handle;
        element.classList.add('dragging');

        const rect = element.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();
        
        this.resizeStart = {
            x: e.clientX,
            y: e.clientY,
            left: rect.left - canvasRect.left + this.canvas.scrollLeft,
            top: rect.top - canvasRect.top + this.canvas.scrollTop,
            width: rect.width,
            height: rect.height
        };

        document.addEventListener('mousemove', this.handleResize);
        document.addEventListener('mouseup', this.stopResizing);
    }

    handleResize = (e) => {
        if (!this.isResizing || !this.selectedElement) return;

        const deltaX = e.clientX - this.resizeStart.x;
        const deltaY = e.clientY - this.resizeStart.y;
        const handle = this.resizeHandle;

        let newLeft = this.resizeStart.left;
        let newTop = this.resizeStart.top;
        let newWidth = this.resizeStart.width;
        let newHeight = this.resizeStart.height;

        // Handle different resize handles
        if (handle.includes('e')) {
            newWidth = Math.max(50, this.resizeStart.width + deltaX);
        }
        if (handle.includes('w')) {
            newWidth = Math.max(50, this.resizeStart.width - deltaX);
            newLeft = this.resizeStart.left + deltaX;
        }
        if (handle.includes('s')) {
            newHeight = Math.max(50, this.resizeStart.height + deltaY);
        }
        if (handle.includes('n')) {
            newHeight = Math.max(50, this.resizeStart.height - deltaY);
            newTop = this.resizeStart.top + deltaY;
        }

        this.selectedElement.style.left = `${newLeft}px`;
        this.selectedElement.style.top = `${newTop}px`;
        this.selectedElement.style.width = `${newWidth}px`;
        this.selectedElement.style.height = `${newHeight}px`;

        this.updateProperties();
    }

    stopResizing = () => {
        if (this.selectedElement) {
            this.selectedElement.classList.remove('dragging');
        }
        this.isResizing = false;
        this.resizeHandle = null;
        document.removeEventListener('mousemove', this.handleResize);
        document.removeEventListener('mouseup', this.stopResizing);
    }

    selectElement(element) {
        this.deselectAll();
        this.selectedElement = element;
        element.classList.add('selected');
        this.updateProperties();
        this.updateDeleteButton();
    }

    deselectAll() {
        if (this.selectedElement) {
            this.selectedElement.classList.remove('selected');
        }
        this.selectedElement = null;
        this.updateProperties();
        this.updateDeleteButton();
    }

    deleteSelected() {
        if (this.selectedElement) {
            const index = this.elements.indexOf(this.selectedElement);
            if (index > -1) {
                this.elements.splice(index, 1);
            }
            this.selectedElement.remove();
            this.selectedElement = null;
            this.updateProperties();
            this.updateDeleteButton();
        }
    }

    clearCanvas() {
        if (confirm('Are you sure you want to clear all elements?')) {
            this.elements.forEach(el => el.remove());
            this.elements = [];
            this.selectedElement = null;
            this.updateProperties();
            this.updateDeleteButton();
        }
    }

    updateDeleteButton() {
        document.getElementById('deleteBtn').disabled = !this.selectedElement;
    }

    updateProperties() {
        const panel = document.getElementById('propertiesContent');
        
        if (!this.selectedElement) {
            panel.innerHTML = '<p class="no-selection">Select an element to edit properties</p>';
            return;
        }

        const isText = this.selectedElement.classList.contains('text-element');
        const isImage = this.selectedElement.classList.contains('image-element');

        let html = '';

        if (isText) {
            const styles = window.getComputedStyle(this.selectedElement);
            html = `
                <div class="property-group">
                    <label>Text Content</label>
                    <textarea id="prop-text" rows="4">${this.selectedElement.textContent}</textarea>
                </div>
                <div class="property-group">
                    <label>Font Size</label>
                    <input type="range" id="prop-fontSize" min="12" max="72" value="${parseInt(styles.fontSize)}">
                    <span class="range-value" id="fontSizeValue">${parseInt(styles.fontSize)}px</span>
                </div>
                <div class="property-group">
                    <label>Text Color</label>
                    <input type="color" id="prop-color" value="${this.rgbToHex(styles.color)}">
                </div>
                <div class="property-group">
                    <label>Font Weight</label>
                    <select id="prop-fontWeight">
                        <option value="normal" ${styles.fontWeight === 'normal' ? 'selected' : ''}>Normal</option>
                        <option value="bold" ${styles.fontWeight === 'bold' ? 'selected' : ''}>Bold</option>
                    </select>
                </div>
                <div class="property-group">
                    <label>Text Align</label>
                    <select id="prop-textAlign">
                        <option value="left" ${styles.textAlign === 'left' ? 'selected' : ''}>Left</option>
                        <option value="center" ${styles.textAlign === 'center' ? 'selected' : ''}>Center</option>
                        <option value="right" ${styles.textAlign === 'right' ? 'selected' : ''}>Right</option>
                    </select>
                </div>
            `;
        } else if (isImage) {
            html = `
                <div class="property-group">
                    <label>Width</label>
                    <input type="number" id="prop-width" value="${parseInt(this.selectedElement.style.width) || 200}">
                </div>
                <div class="property-group">
                    <label>Height</label>
                    <input type="number" id="prop-height" value="${parseInt(this.selectedElement.style.height) || 200}">
                </div>
            `;
        }

        // Common properties
        html += `
            <div class="property-group">
                <label>Position X</label>
                <input type="number" id="prop-x" value="${parseInt(this.selectedElement.style.left) || 0}">
            </div>
            <div class="property-group">
                <label>Position Y</label>
                <input type="number" id="prop-y" value="${parseInt(this.selectedElement.style.top) || 0}">
            </div>
        `;

        panel.innerHTML = html;

        // Setup property change listeners
        if (isText) {
            document.getElementById('prop-text').addEventListener('input', (e) => {
                this.selectedElement.textContent = e.target.value;
            });
            document.getElementById('prop-fontSize').addEventListener('input', (e) => {
                this.selectedElement.style.fontSize = `${e.target.value}px`;
                document.getElementById('fontSizeValue').textContent = `${e.target.value}px`;
            });
            document.getElementById('prop-color').addEventListener('input', (e) => {
                this.selectedElement.style.color = e.target.value;
            });
            document.getElementById('prop-fontWeight').addEventListener('change', (e) => {
                this.selectedElement.style.fontWeight = e.target.value;
            });
            document.getElementById('prop-textAlign').addEventListener('change', (e) => {
                this.selectedElement.style.textAlign = e.target.value;
            });
        } else if (isImage) {
            document.getElementById('prop-width').addEventListener('input', (e) => {
                this.selectedElement.style.width = `${e.target.value}px`;
            });
            document.getElementById('prop-height').addEventListener('input', (e) => {
                this.selectedElement.style.height = `${e.target.value}px`;
            });
        }

        document.getElementById('prop-x').addEventListener('input', (e) => {
            this.selectedElement.style.left = `${e.target.value}px`;
        });
        document.getElementById('prop-y').addEventListener('input', (e) => {
            this.selectedElement.style.top = `${e.target.value}px`;
        });
    }

    rgbToHex(rgb) {
        const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        if (!match) return '#000000';
        return '#' + [1, 2, 3].map(i => {
            const hex = parseInt(match[i]).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    downloadCanvas() {
        // Create a canvas to render the content
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Get all elements bounds
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        this.elements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const canvasRect = this.canvas.getBoundingClientRect();
            const x = rect.left - canvasRect.left + this.canvas.scrollLeft;
            const y = rect.top - canvasRect.top + this.canvas.scrollTop;
            
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + rect.width);
            maxY = Math.max(maxY, y + rect.height);
        });

        if (minX === Infinity) {
            alert('No content to download');
            return;
        }

        const padding = 40;
        const width = maxX - minX + padding * 2;
        const height = maxY - minY + padding * 2;
        
        canvas.width = width;
        canvas.height = height;
        
        // Fill white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);

        // Render each element
        const promises = this.elements.map(el => {
            return new Promise((resolve) => {
                if (el.classList.contains('image-element')) {
                    const img = el.querySelector('img');
                    if (img.complete) {
                        const rect = el.getBoundingClientRect();
                        const canvasRect = this.canvas.getBoundingClientRect();
                        const x = rect.left - canvasRect.left + this.canvas.scrollLeft - minX + padding;
                        const y = rect.top - canvasRect.top + this.canvas.scrollTop - minY + padding;
                        ctx.drawImage(img, x, y, rect.width, rect.height);
                        resolve();
                    } else {
                        img.onload = () => {
                            const rect = el.getBoundingClientRect();
                            const canvasRect = this.canvas.getBoundingClientRect();
                            const x = rect.left - canvasRect.left + this.canvas.scrollLeft - minX + padding;
                            const y = rect.top - canvasRect.top + this.canvas.scrollTop - minY + padding;
                            ctx.drawImage(img, x, y, rect.width, rect.height);
                            resolve();
                        };
                    }
                } else if (el.classList.contains('text-element')) {
                    const rect = el.getBoundingClientRect();
                    const canvasRect = this.canvas.getBoundingClientRect();
                    const x = rect.left - canvasRect.left + this.canvas.scrollLeft - minX + padding;
                    const y = rect.top - canvasRect.top + this.canvas.scrollTop - minY + padding;
                    
                    const styles = window.getComputedStyle(el);
                    ctx.font = `${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
                    ctx.fillStyle = styles.color;
                    ctx.textAlign = styles.textAlign || 'left';
                    ctx.textBaseline = 'top';
                    
                    const lines = el.textContent.split('\n');
                    const lineHeight = parseInt(styles.fontSize) * 1.2;
                    lines.forEach((line, i) => {
                        ctx.fillText(line, x, y + i * lineHeight);
                    });
                    resolve();
                } else {
                    resolve();
                }
            });
        });

        Promise.all(promises).then(() => {
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'canvas-export.png';
                a.click();
                URL.revokeObjectURL(url);
            });
        });
    }
}

// Initialize the editor when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ContentEditor();
});
