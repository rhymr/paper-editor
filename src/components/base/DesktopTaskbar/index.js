/**
 * @class DesktopTaskbar
 * @classdesc Represents a custom HTML element for a desktop taskbar.
 * @augments HTMLElement
 */
export default class DesktopTaskbar extends HTMLElement {
  shadowRoot = this.attachShadow({ mode: 'open' });

  openedTabs = new Map();

  /**
   * Lifecycle method called when the component is added to the DOM.
   * Initializes the taskbar by rendering it, adding event listeners, and starting the time update.
   */
  connectedCallback () {
    this.render();
    this.addEventListeners();
    this.updateTime();
    setInterval(() => this.updateTime(), 1000);
  }

  /**
   * Renders the taskbar UI components and appends them to the shadow DOM.
   * @private
   */
  render () {
    this.shadowRoot.innerHTML = this.getStyles();

    const taskbar = document.createElement('div');
    taskbar.classList.add('taskbar');

    const openedTabs = document.createElement('div');
    openedTabs.classList.add('opened-tabs');

    taskbar.appendChild(openedTabs);

    this.shadowRoot.appendChild(taskbar);
  }

  /**
   * Adds event listeners for taskbar events.
   * @private
   */
  addEventListeners () {
    this.addEventListener('updateTaskbar', this.handleUpdateTaskbar.bind(this));
    this.addEventListener('removeTab', this.handleRemoveTab.bind(this));
  }

  /**
   * Handles the 'updateTaskbar' event to add a new tab to the taskbar.
   * @param {CustomEvent} event - The event containing details about the new tab.
   * @private
   */
  handleUpdateTaskbar (event) {
    const taskbar = this.shadowRoot.querySelector('.opened-tabs');

    const newTab = document.createElement('div');
    newTab.classList.add('open-tab');
    newTab.textContent = event.detail.windowTitle;
    newTab.dataset.windowId = event.detail.windowId;
    newTab.addEventListener('click', this.handleTabClick.bind(this));
    this.openedTabs.set(event.detail.windowId, newTab);

    taskbar.appendChild(newTab);
  }

  /**
   * Handles the click event on a tab to dispatch a 'clickTab' event.
   * @param {MouseEvent} event - The click event on the tab.
   * @private
   */
  handleTabClick (event) {
    const windowId = event.target.dataset.windowId;

    const clickTab = new CustomEvent('clickTab', {
      detail: { windowId },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(clickTab);
  }

  /**
   * Handles the 'removeTab' event to remove a tab from the taskbar.
   * @param {CustomEvent} event - The event containing the ID of the tab to remove.
   * @private
   */
  handleRemoveTab (event) {
    const tabId = event.detail.id;
    const tab = this.openedTabs.get(tabId);
    tab.remove();
    this.openedTabs.delete(tabId);
  }

  /**
   * Updates the displayed time on the taskbar.
   * @private
   */
  updateTime () {
    const timeElement = this.shadowRoot.querySelector('.time');
    const now = new Date();
    const options = { hour: '2-digit', minute: '2-digit' };
    const timeString = now.toLocaleTimeString([], options);
    timeElement.textContent = timeString;
  }

  /**
   * Returns the CSS styles for the taskbar.
   * @returns {string} The CSS styles as a string.
   * @private
   */
  getStyles () {
    return `
    <style>
      * {
        box-sizing: border-box;
        user-select: none;
      }

      :host {
        z-index: 99999;
      }

      .taskbar {
        flex-shrink: 0;
        display: flex;
        flex-flow: row nowrap;
        justify-content: space-between;
        align-items: stretch;
        color: white;
        background: linear-gradient(to bottom, #1a1a1a 0%, #2a2a2a 9%, #1a1a1a 18%, #1a1a1a 92%, #0e0e0e 100%) center/cover no-repeat;
        width: 100%;
        height: 32px;
      }

      .opened-tabs {
        display: flex;
        gap: 1px;
        padding-left: 5px;
        flex-flow: row nowrap;
        flex: 1 1;
        overflow: hidden;
      }

      .open-tab {
        width: 182px;
        height: 26px;
        margin: 3px 0;
        background-color: #2a2a2a; /* base tab color */
        border: 1px solid #3d3d3d;
        border-radius: 4px;
        font-size: 12px;
        line-height: 12px;
        padding: 8px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        word-wrap: break-word;
        cursor: pointer;
        color: #e5e5e5; /* readable text */
        box-shadow: inset 0px -1px 0px 0px rgba(255, 255, 255, 0.05);
        background-image: linear-gradient(
          160deg,
          rgba(255, 255, 255, 0.12) 0%,
          rgba(255, 255, 255, 0.02) 12%
        );
      }
      
      .open-tab:hover {
        background-color: #333;
        border-color: #4a4a4a;
      }
      
      .open-tab:active {
        background-color: #1a1a1a;
        border-color: #555;
        background-image: none;
        box-shadow: inset 2px 2px 0px 0px rgba(255, 255, 255, 0.1);
      }
    </style>
      `;
  }
}

customElements.define('desktop-taskbar', DesktopTaskbar);
