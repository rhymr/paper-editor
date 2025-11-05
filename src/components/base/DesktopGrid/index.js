const baseDesktopIconsImagePath = './assets/images/desktop-icons';

/**
 * @class DesktopGrid
 * @classdesc Represents a grid layout for desktop icons, allowing drag-and-drop functionality.
 * @augments HTMLElement
 */
export default class DesktopGrid extends HTMLElement {
  shadowRoot = this.attachShadow({ mode: 'open' });

  selectedElement;
  draggedElement;
  initialColumn;
  initialRow;

  /**
   * Lifecycle method called when the component is added to the DOM.
   */
  connectedCallback () {
    this.render();
    this.addEventListeners();
  }

  /**
   * Renders the grid and its child elements.
   */
  render () {
    this.shadowRoot.innerHTML = this.getStyles();

    const grid = document.createElement('div');
    grid.classList.add('grid');

    // Create a Rhyme Editor desktop icon
    const rhymeEditorIcon = document.createElement('desktop-icon');
    rhymeEditorIcon.setAttribute('name', 'Paper Editor');
    rhymeEditorIcon.setAttribute('target-tag-name', 'paper-editor');
    rhymeEditorIcon.setAttribute('icon-src', `${baseDesktopIconsImagePath}/address-book.png`); // placeholder icon
    rhymeEditorIcon.style.gridColumnStart = 1;
    rhymeEditorIcon.style.gridRowStart = 1;

    const rhymeSearch = document.createElement('desktop-icon');
    rhymeSearch.setAttribute('name', 'Rhyme Search');
    rhymeSearch.setAttribute('target-tag-name', 'rhyme-search');
    rhymeSearch.setAttribute('icon-src', `${baseDesktopIconsImagePath}/website.png`); // placeholder icon
    rhymeSearch.style.gridColumnStart = 2;
    rhymeSearch.style.gridRowStart = 1;

    const cookieHistory = document.createElement('desktop-icon');
    cookieHistory.setAttribute('name', 'File History');
    cookieHistory.setAttribute('target-tag-name', 'cookie-history');
    cookieHistory.setAttribute('icon-src', `${baseDesktopIconsImagePath}/folder-tree.png`); // placeholder icon
    cookieHistory.style.gridColumnStart = 3;
    cookieHistory.style.gridRowStart = 1;

    const settingsPage = document.createElement('desktop-icon');
    settingsPage.setAttribute('name', 'Settings');
    settingsPage.setAttribute('target-tag-name', 'settings-page');
    settingsPage.setAttribute('icon-src', `${baseDesktopIconsImagePath}/settings.png`); // placeholder icon
    settingsPage.style.gridColumnStart = 4;
    settingsPage.style.gridRowStart = 1;

    grid.appendChild(rhymeEditorIcon);
    grid.appendChild(rhymeSearch);
    grid.appendChild(cookieHistory);
    grid.appendChild(settingsPage);

    this.shadowRoot.appendChild(grid);
  }

  /**
   * Adds event listeners for grid interactions.
   */
  addEventListeners () {
    window.addEventListener('resize', this.handleResize.bind(this));

    const grid = this.shadowRoot.querySelector('.grid');
    grid.addEventListener('drop', this.handleDrop.bind(this));
    grid.addEventListener('dragover', this.handleDragOver.bind(this));
    grid.addEventListener('click', this.handleGridClick.bind(this));

    const cells = this.shadowRoot.querySelectorAll('desktop-icon');
    cells.forEach((cell) => {
      cell.setAttribute('draggable', true);
      cell.addEventListener('dragstart', this.handleDragStart.bind(this));
      cell.addEventListener('dragend', this.handleDragEnd.bind(this));
    });
  }

  /**
   * Handles click events on the grid.
   * @param {Event} event - The click event.
   */
  handleGridClick (event) {
    const targetIcon = event
      .composedPath()
      .find((el) => el.classList && el.classList.contains('desktop-icon'));

    if (this.selectedElement) {
      this.selectedElement.classList.remove('selected');
      this.selectedElement = null;
    }

    if (targetIcon) {
      this.selectedElement = targetIcon;
      this.selectedElement.classList.add('selected');
    }
  }

  /**
   * Handles window resize events to adjust grid layout.
   */
  handleResize () {
    const grid = this.shadowRoot.querySelector('.grid');
    const gridChildren = Array.from(grid.children);

    gridChildren.forEach((child, index) => {
      child.style.gridColumnStart = 1;
      child.style.gridRowStart = index + 1;
    });
  }

  /**
   * Handles the start of a drag event.
   * @param {DragEvent} event - The dragstart event.
   */
  handleDragStart (event) {
    const element = event.target;
    this.draggedElement = element;
    element.classList.add('dragging');
    event.dataTransfer.setData('text/plain', event.target.innerHTML);
    this.initialColumn = parseInt(this.draggedElement.style.gridColumnStart, 10);
    this.initialRow = parseInt(this.draggedElement.style.gridRowStart, 10);

    const dragImage = element.cloneNode(true);
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-9999px';
    document.body.appendChild(dragImage);

    dragImage.style.pointerEvents = 'none';
    // Note! shadowRoot is empty before the element is appended to the DOM
    dragImage.shadowRoot.querySelector('.desktop-icon').classList.add('selected');
    dragImage.style.opacity = '0.75';

    event.dataTransfer.setDragImage(dragImage, 42.5, 20);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  }

  /**
   * Handles dragover events to allow dropping.
   * @param {DragEvent} event - The dragover event.
   */
  handleDragOver (event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  /**
   * Handles drop events to reposition elements.
   * @param {DragEvent} event - The drop event.
   */
  handleDrop (event) {
    event.preventDefault();

    const grid = this.shadowRoot.querySelector('.grid');
    const { left, top, width: gridWidth, height: gridHeight } = grid.getBoundingClientRect();

    const gridStyles = getComputedStyle(grid);
    const columns = gridStyles
      .getPropertyValue('grid-template-columns')
      .split(' ')
      .filter(Boolean).length;
    const rows = gridStyles
      .getPropertyValue('grid-template-rows')
      .split(' ')
      .filter(Boolean).length;

    const columnWidth = parseFloat(gridStyles.getPropertyValue('grid-auto-columns'));
    const rowHeight = parseFloat(gridStyles.getPropertyValue('grid-auto-rows'));
    const columnGap = (gridWidth - columnWidth * columns) / (columns - 1);
    const rowGap = (gridHeight - rowHeight * rows) / (rows - 1);

    const cursorX = event.clientX - left;
    const cursorY = event.clientY - top;
    const targetColumn = this.calculatePosition(cursorX, columnWidth, columnGap);
    const targetRow = this.calculatePosition(cursorY, rowHeight, rowGap);

    if (this.draggedElement) {
      const { finalColumn, finalRow } = this.findAvailablePosition(
        grid,
        targetColumn,
        targetRow,
        columns,
        rows
      );
      this.draggedElement.style.gridColumnStart = finalColumn;
      this.draggedElement.style.gridRowStart = finalRow;
    }
  }

  /**
   * Calculates the grid position based on cursor coordinates.
   * @param {number} coordinate - The cursor coordinate (x or y).
   * @param {number} size - The size of the grid cell (width or height).
   * @param {number} gap - The gap between grid cells.
   * @returns {number} The calculated grid position.
   */
  calculatePosition (coordinate, size, gap) {
    return Math.ceil((coordinate + gap / 2) / (size + gap));
  }

  /**
   * Finds an available position in the grid for the dragged element.
   * @param {HTMLElement} grid - The grid element.
   * @param {number} targetColumn - The target column for the dragged element.
   * @param {number} targetRow - The target row for the dragged element.
   * @param {number} columns - The total number of columns in the grid.
   * @param {number} rows - The total number of rows in the grid.
   * @returns {object} The final column and row for the dragged element.
   */
  findAvailablePosition (grid, targetColumn, targetRow, columns, rows) {
    const gridChildren = Array.from(grid.children);
    let currentColumn = targetColumn;
    let currentRow = targetRow;
    let found = false;

    const isCellOccupied = (column, row) =>
      gridChildren.some((child) => {
        const childColumn = parseInt(child.style.gridColumnStart, 10);
        const childRow = parseInt(child.style.gridRowStart, 10);
        return childColumn === column && childRow === row;
      });

    do {
      const isSameAsInitialPosition =
        currentColumn === this.initialColumn && currentRow === this.initialRow;
      const isCellAvailable = isSameAsInitialPosition || !isCellOccupied(currentColumn, currentRow);

      if (isCellAvailable) {
        found = true;
        break;
      }

      currentRow++;
      if (currentRow > rows) {
        currentRow = 1;
        currentColumn++;
        if (currentColumn > columns) {
          currentColumn = 1;
        }
      }
    } while (currentColumn !== targetColumn || currentRow !== targetRow);

    if (!found) {
      currentColumn = this.initialColumn;
      currentRow = this.initialRow;
    }

    return { finalColumn: currentColumn, finalRow: currentRow };
  }

  /**
   * Handles the end of a drag event.
   * @param {DragEvent} event - The dragend event.
   */
  handleDragEnd (event) {
    event.target.classList.remove('dragging');
    this.draggedElement = null;
  }

  /**
   * Returns the styles for the grid component.
   * @returns {string} The styles as a string.
   */
  getStyles () {
    return `
      <style>
        :host {
          width: 100%;
          height: 100%;
        }

        .grid {
          display: grid;
          grid-gap: 10px 5px;
          grid-template-columns: repeat(auto-fill, 80px);
          grid-template-rows: repeat(auto-fill, 75px);
          grid-auto-rows: 75px;
          grid-auto-columns: 80px;
          justify-content: space-between;
          align-content: space-between;
          width: 100%;
          height: 100%;
          padding: 5px;
          box-sizing: border-box;
        }
      </style>
    `;
  }
}

customElements.define('desktop-grid', DesktopGrid);
