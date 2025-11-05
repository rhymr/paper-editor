import DesktopWindow from '../base/DesktopWindow/index.js';
import { basicSetup } from 'codemirror';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { autocompletion } from '@codemirror/autocomplete';
import { barf } from 'thememirror';
import { wordCounter } from './codemirror/wordsCount';
import { syllableCounter, syllableCountCache } from './codemirror/syllableGutter';
import { englishCompletions } from './codemirror/completions';
import { phoneticRhymeHighlighter } from './codemirror/rhymeHighlighter';

// ────────────────────────────────
//  Bare-bones XP window + CodeMirror
// ────────────────────────────────
export default class PaperEditor extends DesktopWindow {
  static get tagName () { return 'paper-editor'; }

  constructor () {
    super({
      title: 'Paper Editor',
      width: 900,
      height: 600,
      resizable: true
    });
    this.editorView = null;
    this._resizeObserver = null;
  }

  connectedCallback () {
    super.connectedCallback();

    // Set a more appropriate default window size (responsive)
    if (!this.style.width) this.style.width = '30vw';
    if (!this.style.height) this.style.height = '70vh';

    // Clean window body styling
    const body = this.shadowRoot.querySelector('.window__body');
    body.style.cssText = `
      margin: 0;
      padding: 0;
      display: flex;
      background: #1e1e1e;
      color: #fff;
      height: 100%;
      width: 100%;
      min-width: 0;
      min-height: 0;
      overflow: hidden;
    `;

    // Create editor container (like old #editor div)
    const editorContainer = document.createElement('div');
    editorContainer.id = 'editor';
    editorContainer.style.cssText = `
      flex: 1;
      margin: 8px;
      background: #111;
      border: 1px solid #333;
      border-radius: 4px;
      overflow: hidden;
      display: flex;
      min-height: 0;
      min-width: 0;
    `;
    body.appendChild(editorContainer);

    // Inject editor styling from old project (scoped to shadow DOM)
    const style = document.createElement('style');
    style.textContent = `
      /* Base font for the window and ensure width is controlled by explicit size, not content */
      :host { width: auto; min-width: 0; box-sizing: border-box; }
      .window { width: 100%; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; }
      .window__body { width: 100%; min-width: 0; min-height: 0; box-sizing: border-box; display: flex; }
      /* Editor font family & size */
      .cm-editor, .cm-content, .cm-scroller { font-family: monospace; font-size: inherit; }
      /* Fill available space */
      #editor { display: flex; min-height: 0; flex: 1 1 auto; }
      .cm-editor { width: 100%; height: 100%; min-height: 0; padding: 0 3px 3px 3px; }
      .cm-scroller { height: 100%; min-height: 0; overflow-y: auto; overflow-x: hidden; scrollbar-width: none; -ms-overflow-style: none; }
      .cm-scroller::-webkit-scrollbar { display: none; width: 0; height: 0; }
      /* Force long tokens to wrap inside the window */
      .cm-content { white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere; }
      .cm-line { word-break: break-word; overflow-wrap: anywhere; }
      /* Gutter font to match editor */
      .cm-gutters { font-family: monospace; font-size: inherit; margin-right: 8px; }
      /* CodeMirror line padding */
      .cm-editor .cm-line { padding: 0 2px 0 10px; }
      /* Syllable gutter color */
      .cm-syllableCounter { color: yellowgreen; }
      /* Remove default outline when focused */
      .cm-editor.cm-focused { outline: 0; }
      /* Word count panel */
      #word-count { padding-left: 5px; margin: 3px; }
      /* Rhyme highlight text styling */
      .cm-content .rhyme-highlight { font-weight: bold; color: #000; }
    `;
    this.shadowRoot.appendChild(style);

    // Create editor state + view
    const state = EditorState.create({
      doc: '',
      extensions: [
        basicSetup,
        barf,
        EditorView.lineWrapping,
        // Enable native browser spellcheck inside CodeMirror content
        EditorView.contentAttributes.of({ spellcheck: 'true', autocapitalize: 'off', autocorrect: 'off' }),
        autocompletion({ override: [englishCompletions] }),
        wordCounter(),
        syllableCounter(),
        EditorView.updateListener.of(update => {
          if (update.docChanged && update.changes.length > 10) {
            syllableCountCache.clear();
          }
        }),
        phoneticRhymeHighlighter
      ]
    });

    this.editorView = new EditorView({
      state,
      parent: editorContainer
    });

    // Optional: make sure it focuses automatically
    this.editorView.focus();

    // Keep wrapping responsive to window resizing
    this._resizeObserver = new ResizeObserver(() => {
      if (this.editorView) {
        // Ask CodeMirror to re-measure layout based on the new container size
        // This ensures wrapping recalculates precisely at current window width
        // eslint-disable-next-line n/no-unsupported-features/node-builtins
        this.editorView.requestMeasure?.({});
      }
    });
    this._resizeObserver.observe(editorContainer);
  }

  disconnectedCallback () {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    if (this.editorView) this.editorView.destroy();
    super.disconnectedCallback();
  }

  /**
   * Creates the control panel for the chat application.
   * @returns {HTMLElement} The control panel element.
   */
  createControlPanel () {
    const controlPanel = document.createElement('div');
    controlPanel.classList.add('window__control-panel');

    controlPanel.innerHTML = `
        <div class="window__dropdown">
          <div class="window__dropdown-activator">File</div>
          <div class="window__dropdown-content">
            <div class="window__dropdown-choice">New</div>
            <div class="window__dropdown-choice">Open</div>
            <div class="window__dropdown-choice">Save</div>
          </div>
        </div>
        <div class="window__dropdown">
          <div class="window__dropdown-activator">Edit</div>
          <div class="window__dropdown-content">
            <div class="window__dropdown-choice">Cut</div>
            <div class="window__dropdown-choice">Copy</div>
            <div class="window__dropdown-choice">Paste</div>
            <div class="window__dropdown-choice"></div>
            <div class="window__dropdown-choice">Undo</div>
            <div class="window__dropdown-choice">Redo</div>
          </div>
        </div>
      `;

    return controlPanel;
  }
}

customElements.define(PaperEditor.tagName, PaperEditor);
