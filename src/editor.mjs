import {basicSetup} from "codemirror"
import {barf} from 'thememirror';
import {EditorView} from "@codemirror/view"
import {autocompletion} from "@codemirror/autocomplete"
import {initializeUIElements, setEditorView} from "./ui.js";
import {checkAndUpdateForContent} from "./utils/util.js";
import {autoSaveEnabled} from "./config/config.js";
import {wordCounter} from "./words/words.js";
import {syllableCountCache, syllableCounter} from "./words/syllables.js";
import {englishCompletions} from "./words/completions.js";

export function updateListener() {
    return EditorView.updateListener.of(update => {
        if (update.docChanged) {
            if (autoSaveEnabled) {
                const editorContent = update.view.state.doc.toString();
                checkAndUpdateForContent(editorContent);
            }

            if (update.changes.length > 10) {
                syllableCountCache.clear();
            }
        }
    });
}

export function createEditorConfig() {
    return [
        basicSetup,
        barf,
        syllableCounter(),
        updateListener(),
        wordCounter(),
        autocompletion({override: [englishCompletions]})
    ];
}

export const view = new EditorView({
    extensions: createEditorConfig(),
    parent: document.body.querySelector("#editor"),
})

setEditorView(view);

initializeUIElements();