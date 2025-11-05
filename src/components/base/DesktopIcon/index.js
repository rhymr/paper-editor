const baseDesktopIconsImagePath = './assets/images/desktop-icons';

/**
 * @class DesktopIcon
 * @classdesc Represents a desktop icon element with customizable attributes for name, target window, and resizability.
 * @augments HTMLElement
 */
export default class DesktopIcon extends HTMLElement {
  shadowRoot = this.attachShadow({ mode: 'open' });

  name;

  /**
   * Lifecycle method called when the component is added to the DOM.
   * Initializes the rendering and event listeners.
   */
  connectedCallback () {
    this.render();
    this.addEventListeners();
  }

  /**
   * Renders the desktop icon element with its attributes and styles.
   */
  render () {
    this.shadowRoot.innerHTML = this.getStyles();

    const iconSrc =
      this.getAttribute('icon-src') || `${baseDesktopIconsImagePath}/folder-empty.png`;
    const name = this.getAttribute('name') || 'New Folder';
    const targetTagName = this.getAttribute('target-tag-name') || 'desktop-window';
    const isResizable = this.getAttribute('resizable') !== 'false'; // defaults to true
    this.name = name;
    this.targetTagName = targetTagName;
    this.isResizable = isResizable;

    const cell = document.createElement('div');
    cell.classList.add('desktop-icon');

    cell.innerHTML = `
      <img src="${iconSrc}">
      <span class="desktop-icon__name">
        ${name}
      </span>
    `;

    this.shadowRoot.appendChild(cell);
  }

  /**
   * Adds event listeners for the desktop icon interactions.
   */
  addEventListeners () {
    this.addEventListener('dblclick', this.handleDoubleClick.bind(this));
  }

  /**
   * Handles the double-click event on the desktop icon.
   * Dispatches a custom event with details about the icon.
   */
  handleDoubleClick () {
    const event = new CustomEvent('iconDoubleClick', {
      detail: {
        windowTitle: this.name,
        windowTag: this.targetTagName,
        isResizable: this.isResizable
      },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  /**
   * Returns the styles for the desktop icon element.
   * @returns {string} The styles as a string.
   */
  getStyles () {
    return `
      <style>
        .desktop-icon {
          width: 85px;
          height: 75px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          overflow: hidden;
        }

        .desktop-icon img {
          justify-self: flex-start;
          width: 36px;
          height: 36px;
          margin-bottom: 5px;
        }

        .selected .desktop-icon__name {
          background-color: #99c0ff;
        }

        .desktop-icon__name {
          color: black;
          text-align: center;
          display: block;
          font-size: 12px;
          line-height: 16px;
          text-overflow: ellipsis;
          overflow-wrap: break-word;
          text-shadow: 4px 4px 4px rgba(0, 0, 0, 0.5);
        }
      </style>
    `;
  }
}

customElements.define('desktop-icon', DesktopIcon);
