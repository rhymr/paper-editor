import DesktopWindow from '../base/DesktopWindow/index.js';

export default class CookieHistory extends DesktopWindow {
  static get tagName () {
    return 'cookie-history';
  }

  constructor () {
    super({
      title: 'Cookie History',
      width: 640,
      height: 400,
      resizable: true
    });
  }

  connectedCallback () {
    super.connectedCallback();
  }
}

// Register with the browser so PersonalWebDesktop can spawn it
customElements.define(CookieHistory.tagName, CookieHistory);
