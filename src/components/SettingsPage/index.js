import DesktopWindow from '../base/DesktopWindow/index.js';

export default class SettingsPage extends DesktopWindow {
  static get tagName () { return 'settings-page'; }

  constructor () {
    super({
      title: 'Settings',
      width: 520,
      height: 420,
      resizable: true
    });
  }

  connectedCallback () {
    super.connectedCallback();
  }
}

customElements.define(SettingsPage.tagName, SettingsPage);
