const baseIconsImagePath = './assets/icons';

const DragManager = {
  currentlyDraggedInstance: null
};

window.addEventListener('mousemove', handleMouseMoveForDrag);
window.addEventListener('mouseout', stopDrag);
window.addEventListener('mouseup', stopDrag);

/**
 * Stops the dragging operation by resetting the dragging state
 * of the currently dragged instance.
 * Sets the currentlyDraggedInstance to null.
 */
function stopDrag () {
  const instance = DragManager.currentlyDraggedInstance;
  if (instance) {
    instance.isDragging = false;
    DragManager.currentlyDraggedInstance = null;
  }
}

/**
 * Handles the mouse move event for dragging.
 * Updates the position of the currently dragged instance.
 * @param {MouseEvent} event - The mouse move event.
 */
function handleMouseMoveForDrag (event) {
  const instance = DragManager.currentlyDraggedInstance;

  if (!instance || !instance.isDragging) return;

  const { clientX, clientY } = event;
  const { offsetX, offsetY, maxX, maxY, style } = instance;

  const newX = Math.min(clientX - offsetX, maxX - 1);
  const newY = Math.min(Math.max(0, clientY - offsetY), maxY);

  style.left = `${newX}px`;
  style.top = `${newY}px`;
}

const ResizeManager = {
  currentlyResizedInstance: null
};

window.addEventListener('mousemove', handleMouseMoveForResize);
window.addEventListener('mouseout', stopResize);
window.addEventListener('mouseup', stopResize);

/**
 * Stops the resizing operation by resetting the resizing state
 * of the currently resized instance.
 * Sets the currentlyResizedInstance to null.
 */
function stopResize () {
  const instance = ResizeManager.currentlyResizedInstance;
  if (instance) {
    instance.isResizingX = false;
    instance.isResizingY = false;
    ResizeManager.currentlyResizedInstance = null;
  }
}

/**
 * Handles the mouse move event for resizing.
 * Updates the dimensions of the currently resized instance.
 * @param {MouseEvent} event - The mouse move event.
 */
function handleMouseMoveForResize (event) {
  const instance = ResizeManager.currentlyResizedInstance;
  if (!instance) return;

  const { clientX, clientY } = event;
  const { offsetLeft, offsetTop, style } = instance;

  const minWidth = 260; // Ensure room for title bar controls and border
  const minHeight = 140; // Maintain usable body area and border

  if (instance.isResizingX) {
    const newWidth = Math.max(minWidth, clientX - offsetLeft + 3);
    style.width = `${newWidth}px`;
  }

  if (instance.isResizingY) {
    const newHeight = Math.max(minHeight, clientY - offsetTop);
    style.height = `${newHeight}px`;
  }
}

/**
 * @class DesktopWindow
 * @classdesc Represents a desktop window component that can be dragged, resized, minimized, and maximized.
 * This class extends the HTMLElement and provides custom behavior for window management.
 * @augments HTMLElement
 */
export default class DesktopWindow extends HTMLElement {
  shadowRoot = this.attachShadow({ mode: 'open' });

  isFocused = false;
  isDragging = false;
  maxX = window.innerWidth;
  // 32 (taskbar height) + 28 (window title bar height) = 60
  maxY = window.innerHeight - 60;
  offsetX;
  offsetY;
  isResizable;
  body;

  /**
   * Called when the element is added to the document.
   * Initializes the component by rendering and adding event listeners.
   */
  connectedCallback () {
    this.dataId = this.dataset.windowId;
    this.isResizable = this.getAttribute('resizable') !== 'false';
    this.render();
    this.addEventListeners();
  }

  /**
   * Renders the window's HTML structure and appends it to the shadow DOM.
   */
  render () {
    this.shadowRoot.innerHTML = this.getStyles();
    const container = this.createWindowContainer();
    this.body = this.createWindowBody();

    const controlPanel = this.createControlPanel();
    if (controlPanel) {
      container.appendChild(controlPanel);
    }
    container.appendChild(this.body);

    this.shadowRoot.appendChild(container);
  }

  /**
   * Creates the window container element with title bar and resizers.
   * @returns {HTMLElement} The window container element.
   */
  createWindowContainer () {
    const container = document.createElement('div');
    container.classList.add('window');
    container.innerHTML = `
      <div class="window__title-bar">
        <div class="window__title-bar-text">${this.getWindowTitle()}</div>
        <div class="window__title-bar-controls">
          <button class="title-bar-button" aria-label="Minimize"></button>
          <button class="title-bar-button" aria-label="Maximize"></button>
          <button class="title-bar-button" aria-label="Close"></button>
        </div>
      </div>
      <div class="window__resizer_bottom"></div>
      <div class="window__resizer_corner"></div>
      <div class="window__resizer_right"></div>
    `;
    return container;
  }

  /**
   * Creates the window body element.
   * @returns {HTMLElement} The window body element.
   */
  createWindowBody () {
    const body = document.createElement('div');
    body.classList.add('window__body');
    return body;
  }

  /**
   * Retrieves the window title from the element's attributes.
   * @returns {string} The window title.
   */
  getWindowTitle () {
    return this.getAttribute('title') || 'Untitled Window';
  }

  /**
   * Creates the control panel for the window.
   * This method should be implemented in a subclass.
   * @returns {HTMLElement|null} The control panel element or null.
   */
  createControlPanel () {
    /*
     * This method must be implemented in a subclass.
     * Here's an example implementation:
     *
     * const controlPanel = document.createElement('div');
     * controlPanel.classList.add('window__control-panel');
     *
     * controlPanel.innerHTML = `
     *   <div class="window__dropdown">
     *     <div class="window__dropdown-activator">File</div>
     *     <div class="window__dropdown-content">
     *       <div class="window__dropdown-choice">New</div>
     *       <div class="window__dropdown-choice">Open</div>
     *       <div class="window__dropdown-choice">Save</div>
     *     </div>
     *   </div>
     *   <div class="window__dropdown">
     *     <div class="window__dropdown-activator">Edit</div>
     *     <div class="window__dropdown-content">
     *       <div class="window__dropdown-choice">Cut</div>
     *       <div class="window__dropdown-choice">Copy</div>
     *       <div class="window__dropdown-choice">Paste</div>
     *     </div>
     *   </div>
     * `;
     *
     * return controlPanel;
     */
    return null;
  }

  /**
   * Adds event listeners for the window's interactive elements.
   */
  addEventListeners () {
    const titleBar = this.shadowRoot.querySelector('.window__title-bar');
    titleBar.addEventListener('mousedown', this.handleTitleBarMouseDown.bind(this));
    titleBar.addEventListener('click', this.handleTitleBarClick.bind(this));
    this.shadowRoot.addEventListener('mousedown', this.handleResizerMouseDown.bind(this));
    this.shadowRoot.addEventListener('click', this.handleControlPanelClick.bind(this));
    window.addEventListener('windowFocusChange', this.handleFocusChange.bind(this));
  }

  /**
   * Handles click events on the title bar buttons.
   * @param {MouseEvent} event - The click event.
   */
  handleTitleBarClick (event) {
    const target = event.target;

    switch (target.getAttribute('aria-label')) {
      case 'Close':
        this.handleCloseClick();
        break;
      case 'Maximize':
        this.handleMaximizeClick();
        break;
      case 'Minimize':
        this.handleMinimizeClick();
        break;
    }
  }

  /**
   * Handles the close button click event.
   * Dispatches a custom event to close the window.
   */
  handleCloseClick () {
    const closeEvent = new CustomEvent('closeWindow', {
      detail: { id: this.dataId },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(closeEvent);
  }

  /**
   * Handles the maximize button click event.
   * Toggles the maximized state of the window.
   */
  handleMaximizeClick () {
    this.classList.toggle('maximized');
  }

  /**
   * Handles the minimize button click event.
   * Hides the window by setting its display to 'none'.
   */
  handleMinimizeClick () {
    this.style.display = 'none';
  }

  /**
   * Handles click events on the control panel.
   * @param {MouseEvent} event - The click event.
   */
  handleControlPanelClick (event) {
    const target = event.target;
    const isActivator = target.classList.contains('window__dropdown-activator');
    const isChoice = target.classList.contains('window__dropdown-choice');
    const isContent = target.classList.contains('window__dropdown-content');

    if (isActivator) {
      this.toggleDropdown(target);
    } else if (isChoice) {
      this.closeDropdown(target.parentNode);
    } else if (!isContent) {
      this.closeAllDropdowns();
    }
  }

  /**
   * Toggles the visibility of a dropdown menu.
   * @param {HTMLElement} activator - The dropdown activator element.
   */
  toggleDropdown (activator) {
    const content = activator.parentNode.querySelector('.window__dropdown-content');
    const isContentVisible = content.style.display === 'block';
    this.closeAllDropdowns(content);
    content.style.display = isContentVisible ? 'none' : 'block';
    activator.parentNode.classList.toggle('active', !isContentVisible);
  }

  /**
   * Closes a specific dropdown menu.
   * @param {HTMLElement} dropdownContent - The dropdown content element.
   */
  closeDropdown (dropdownContent) {
    dropdownContent.style.display = 'none';
    dropdownContent.parentNode.classList.remove('active');
  }

  /**
   * Closes all dropdown menus except the specified one.
   * @param {HTMLElement|null} excludeContent - The dropdown content to exclude from closing.
   */
  closeAllDropdowns (excludeContent = null) {
    const allDropdownContents = this.shadowRoot.querySelectorAll('.window__dropdown-content');
    allDropdownContents.forEach((dropdownContent) => {
      if (dropdownContent !== excludeContent) {
        dropdownContent.style.display = 'none';
        dropdownContent.parentNode.classList.remove('active');
      }
    });
  }

  /**
   * Handles the mousedown event on the title bar for dragging.
   * Sets the instance as the currently dragged instance.
   * @param {MouseEvent} event - The mousedown event.
   */
  handleTitleBarMouseDown (event) {
    if (event.target.tagName !== 'BUTTON') {
      this.isDragging = true;
      this.offsetX = event.offsetX;
      this.offsetY = event.offsetY;
      this.maxX = window.innerWidth;
      // 32 (taskbar height) + 28 (window title bar height) = 60
      this.maxY = window.innerHeight - 60;
      DragManager.currentlyDraggedInstance = this;
    }
  }

  /**
   * Handles the mousedown event on the resizers for resizing.
   * Sets the instance as the currently resized instance.
   * @param {MouseEvent} event - The mousedown event.
   */
  handleResizerMouseDown (event) {
    const target = event.target;
    const isBottomResizer = target.classList.contains('window__resizer_bottom');
    const isRightResizer = target.classList.contains('window__resizer_right');
    const isCornerResizer = target.classList.contains('window__resizer_corner');
    const isMaximized = this.classList.contains('maximized');
    const isResizable = this.isResizable;

    if (!isMaximized && isResizable && (isBottomResizer || isRightResizer || isCornerResizer)) {
      ResizeManager.currentlyResizedInstance = this;
      this.isResizingY = isBottomResizer || isCornerResizer;
      this.isResizingX = isRightResizer || isCornerResizer;
    }
  }

  /**
   * Handles the custom window focus change event.
   * Updates the focus state of the window.
   * @param {CustomEvent} event - The custom event with focus details.
   */
  handleFocusChange (event) {
    const focusedWindowId = event.detail.focusedWindowId;
    this.isFocused = this.dataset.windowId === focusedWindowId;
  }

  /**
   * Returns the styles for the window component.
   * @returns {string} The styles as a string.
   */
  getStyles () {
    return `
      <style>
        :host {
          display: flex;
          flex-flow: column nowrap;
          position: fixed;
          min-width: 260px; /* retain left/right border and controls */
          min-height: 140px; /* retain title bar and body */
          max-width: 100%;
          max-height: calc(100% - 35px);
          width: fit-content;
          height: fit-content;
          font-family: monospace, monospace;
          font-size: 11px;
          box-shadow: inset -1px -1px #00138c, inset 1px 1px #0831d9, inset -2px -2px #001ea0,
            inset 2px 2px #166aee, inset -3px -3px #003bda, inset 3px 3px #0855dd;
          padding: 4px;
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
          -webkit-font-smoothing: antialiased;
          background: #1E1E1E;
        }

        :host(.maximized) {
          width: 100% !important;
          height: calc(100% - 35px) !important;
          top: 0 !important;
          left: 0 !important;
        }

        button:not(.title-bar-button) {
          font-size: 11px;
          -webkit-font-smoothing: antialiased;
          box-sizing: border-box;
          border: 1px solid #003c74;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 1) 0%,
            rgba(236, 235, 229, 1) 86%,
            rgba(216, 208, 196, 1) 100%
          );
          box-shadow: none;
          border-radius: 3px;
          min-width: 23px;
          min-height: 23px;
          padding: 0 12px;
        }

        button:not(.title-bar-button):not(:disabled):active {
          box-shadow: none;
          background: linear-gradient(
            180deg,
            rgba(205, 202, 195, 1) 0%,
            rgba(227, 227, 219, 1) 8%,
            rgba(229, 229, 222, 1) 94%,
            rgba(242, 242, 241, 1) 100%
          );
        }

        button:not(.title-bar-button):not(:disabled):focus{
          outline: 1px dotted #000000;
          outline-offset: -4px;
          box-shadow: inset -1px 1px #cee7ff, inset 1px 2px #98b8ea, inset -2px 2px #bcd4f6, inset 1px -1px #89ade4,
            inset 2px -2px #89ade4;
        }

        button:not(.title-bar-button):not(:disabled):hover {
         box-shadow: inset -1px 1px #fff0cf, inset 1px 2px #fdd889, inset -2px 2px #fbc761, inset 2px -2px #e5a01a;
        }

        button:not(.title-bar-button)::-moz-focus-inner {
          border: 0;
        }

        .window {
          display: flex;
          flex-flow: column nowrap;
          flex-grow: 1;
        }

        .window__resizer_corner,
        .window__resizer_bottom,
        .window__resizer_right {
          user-select: none;
        }

        .window__resizer_corner {
          position: absolute;
          width: 6px;
          height: 6px;
          bottom: 0;
          right: 0;
        }

        :host(:not(.maximized)) .window__resizer_corner {
          cursor: ${this.isResizable ? 'nwse-resize' : 'default'};
        }

        .window__resizer_bottom {
          position: absolute;
          width: calc(100% - 6px);
          height: 4px;
          bottom: 0;
          left: 0;
        }

        :host(:not(.maximized)) .window__resizer_bottom {
          cursor: ${this.isResizable ? 'ns-resize' : 'default'};
        }
 
        .window__resizer_right {
          position: absolute;
          width: 4px;
          height: calc(100% - 6px);
          top: 0;
          right: 0;
        }
      
        :host(:not(.maximized)) .window__resizer_right {
          cursor: ${this.isResizable ? 'ew-resize' : 'default'};
        }

        .window__title-bar {
          user-select: none;
          box-sizing: content-box;
          background: linear-gradient(
            180deg,
            rgba(9, 151, 255, 1) 0%,
            rgba(0, 83, 238, 1) 8%,
            rgba(0, 80, 238, 1) 40%,
            rgba(0, 102, 255, 1) 88%,
            rgba(0, 102, 255, 1) 93%,
            rgba(0, 91, 255, 1) 95%,
            rgba(0, 61, 215, 1) 96%,
            rgba(0, 61, 215, 1) 100%
          );
          margin: -4px -4px 0;
          padding: 3px 5px 3px 3px;
          border-top: 1px solid #0831d9;
          border-left: 1px solid #0831d9;
          border-right: 1px solid #001ea0;
          border-top-left-radius: 8px;
          border-top-right-radius: 7px;
          font-size: 13px;
          text-shadow: 1px 1px #0f1089;
          height: 21px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .window__title-bar-text {
          font-weight: bold;
          color: white;
          letter-spacing: 0;
          margin-right: 24px;
          padding-left: 3px;
        }

        .window__title-bar-controls {
          display: flex;
        }

        .window__control-panel {
          display: flex;
          flex-flow: row nowrap;
          justify-content: flex-start;
          border-bottom: 1px solid #bd3939;
          background: #333;
          color: #fff;
          padding-left: 5px;
        }

        .window__dropdown {
          position: relative;
          cursor: default;
          margin: 0;
          user-select: none;
        }
          
        .window__dropdown-activator {
          padding: 0.25rem 0.5rem;
        }

        .window__dropdown-activator:not(.disabled):hover {
          background-color: #444;
        }

        .window__dropdown-content {
          display: none;
          position: absolute;
          left: 0;
          top: 100%;
          background: #333;
          border: 1px solid #bd3939;
          border-top: none;
          min-width: 33px;
          z-index: 2;
        }

        .window__dropdown-choice {
          max-width: 128px;
          padding: 0.25rem 0.5rem;
          white-space: normal;
          word-wrap: break-word;
        }

        .window__dropdown-choice:not(.disabled):hover {
          background-color: #444;
        }

        .window__dropdown-activator.disabled,
        .window__dropdown-choice.disabled {
          pointer-events: none;
          color: #aaa
        }

        .window__body {
          height: 100%;
          max-height: calc(100svh - 89px);
          padding: 8px;
          overflow: hidden;
        }

        button.title-bar-button {
          min-width: 21px;
          min-height: 21px;
          margin-left: 2px;
          background-repeat: no-repeat;
          background-position: center;
          box-shadow: none;
          background-color: #0050ee;
          transition: background 100ms;
          border: none;
        }

        button.title-bar-button:active,
        button.title-bar-button:hover,
        button.title-bar-button:focus {
          outline: none;
          box-shadow: none;
        }
        button.title-bar-button[aria-label='Minimize'] {
          background-image: url('${baseIconsImagePath}/minimize.svg');
        }

        button.title-bar-button[aria-label='Minimize']:hover {
          background-image: url('${baseIconsImagePath}/minimize-hover.svg');
        }

        button.title-bar-button[aria-label='Minimize']:not(:disabled):active {
          background-image: url('${baseIconsImagePath}/minimize-active.svg');
        }

        button.title-bar-button[aria-label='Maximize'] {
          background-image: url('${baseIconsImagePath}/maximize.svg');
        }

        button.title-bar-button[aria-label='Maximize']:hover {
          background-image: url('${baseIconsImagePath}/maximize-hover.svg');
        }

        button.title-bar-button[aria-label='Maximize']:not(:disabled):active {
          background-image: url('${baseIconsImagePath}/maximize-active.svg');
        }

        button.title-bar-button[aria-label='Restore'] {
          background-image: url('${baseIconsImagePath}/restore.svg');
        }

        button.title-bar-button[aria-label='Restore']:hover {
          background-image: url('${baseIconsImagePath}/restore-hover.svg');
        }

        button.title-bar-button[aria-label='Restore']:not(:disabled):active {
          background-image: url('${baseIconsImagePath}/restore-active.svg');
        }

        button.title-bar-button[aria-label='Help'] {
          background-image: url('${baseIconsImagePath}/help.svg');
        }

        button.title-bar-button[aria-label='Help']:hover {
          background-image: url('${baseIconsImagePath}/help-hover.svg');
        }

        button.title-bar-button[aria-label='Help']:not(:disabled):active {
          background-image: url('${baseIconsImagePath}/help-active.svg');
        }

        button.title-bar-button[aria-label='Close'] {
          background-image: url('${baseIconsImagePath}/close.svg');
        }

        button.title-bar-button[aria-label='Close']:hover {
          background-image: url('${baseIconsImagePath}/close-hover.svg');
        }

        button.title-bar-button[aria-label='Close']:not(:disabled):active {
          background-image: url('${baseIconsImagePath}/close-active.svg');
        }

        label {
          font-size: 11px;
          display: inline-flex;
          align-items: center;
          -webkit-font-smoothing: antialiased;
        }
  
        input {
          font-size: 11px;
          -webkit-font-smoothing: antialiased;
        }

        textarea {
          font-size: 11px;
          padding: 3px 4px;
          border: none;
          background-color: #fff;
          box-sizing: border-box;
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          border-radius: 0;
          -webkit-font-smoothing: antialiased;
        }

        textarea:focus,
        input:focus-visible {
          outline: none;
        }

        input[type="radio"] {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          margin: 0;
          background: 0;
          position: fixed;
          opacity: 0;
          border: none;
        }

        input[type="radio"] + label {
          line-height: 16px;
          position: relative;
          margin-left: 18px;
        }

        input[type="radio"] + label::before {
          content: "";
          position: absolute;
          top: 0;
          left: -18px;
          display: inline-block;
          width: 12px;
          height: 12px;
          margin-right: 6px;
          background: linear-gradient(135deg, rgba(220, 220, 215, 1) 0%, rgba(255, 255, 255, 1) 100%);
          border: 1px solid #1d5281;
          border-radius: 50%;
        }

        input[type="radio"]:not([disabled]):not(:active) + label:hover::before {
          box-shadow: inset -2px -2px #f8b636, inset 2px 2px #fedf9c;
        }

        input[type="radio"]:active + label::before {
          background: linear-gradient(135deg, rgba(176, 176, 167, 1) 0%, rgba(227, 225, 210, 1) 100%);
        }

        input[type="radio"]:checked + label::after {
          content: "";
          display: block;
          width: 5px;
          height: 5px;
          top: 4px;
          left: -14px;
          position: absolute;
          background: url('${baseIconsImagePath}/radio-dot.svg');
        }

        input[type="radio"]:focus + label {
          outline: 1px dotted #000;
        }

        input[type="radio"][disabled] + label::before {
          background: white;
          border: 1px solid #cac8bb;
        }

        input[type="radio"][disabled]:checked + label::after {
          background: url('${baseIconsImagePath}/radio-dot-disabled.svg');
        }

        input[type="checkbox"] {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          margin: 0;
          background: 0;
          position: fixed;
          opacity: 0;
          border: none;
        }

        input[type="checkbox"] + label {
          line-height: 13px;
          position: relative;
          margin-left: 19px;
        }

        input[type="checkbox"] + label::before {
          content: "";
          position: absolute;
          left: -19px;
          display: inline-block;
          width: 13px;
          height: 13px;
          margin-right: 6px;
          border: 1px solid #1d5281;
          background: linear-gradient(135deg, rgba(220, 220, 215, 1) 0%, rgba(255, 255, 255, 1) 100%);
        }

        input[type="checkbox"]:focus + label {
          outline: 1px dotted #000;
        }

        input[type="checkbox"]:active + label::before {
          linear-gradient(135deg, rgba(176, 176, 167, 1) 0%, rgba(227, 225, 210, 1) 100%);
        }

        input[type="checkbox"]:checked + label::after {
          content: "";
          display: block;
          width: 11px;
          height: 11px;
          position: absolute;
          background: url('${baseIconsImagePath}/checkmark.svg');
          top: 1px;
          left: -17px;
        }

        input[type="checkbox"]:not([disabled]):not(:active) + label:hover::before {
          box-shadow: inset -2px -2px #f8b636, inset 2px 2px #fedf9c;
        }

        input[type="checkbox"][disabled] + label::before {
          background: white;
          border: 1px solid #cac8bb;
        }

        input[type="checkbox"][disabled]:checked + label::after {
          background: url('${baseIconsImagePath}/checkmark-disabled.svg');
        }

        *::-webkit-scrollbar {
          width: 17px;
          height: 17px;
          background: #ebf3fc;
        }

        *::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #c3d9ff, #94bce0);
          border: 1px solid #95bce0;
          border-radius: 0;
        }

        *::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #b0cfff, #80ace0);
        }

        *::-webkit-scrollbar-button:single-button {
          background: #ebf3fc;
          height: 17px;
          width: 17px;
          border: 1px solid #95bce0;
        }

        *::-webkit-scrollbar-button:single-button:vertical:decrement {
          background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="8" height="4"><polygon points="0,4 4,0 8,4" fill="%233a6ea5"/></svg>');
          background-repeat: no-repeat;
          background-position: center;
        }

        *::-webkit-scrollbar-button:single-button:vertical:increment {
          background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="8" height="4"><polygon points="0,0 4,4 8,0" fill="%233a6ea5"/></svg>');
          background-repeat: no-repeat;
          background-position: center;
        }
      </style>
    `;
  }
}

customElements.define('desktop-window', DesktopWindow);
