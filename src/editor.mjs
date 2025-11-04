import {basicSetup} from "codemirror"
import {barf} from 'thememirror';
import {EditorView} from "@codemirror/view"
import {autocompletion} from "@codemirror/autocomplete"
import {initializeUIElements, setEditorView, rhymeCompartment, syllableCompartment} from "./ui.js";
import {checkAndUpdateForContent} from "./utils/util.js";
import {autoSaveEnabled} from "./config/config.js";
import {wordCounter} from "./codemirror/wordsCount.js";
import {syllableCountCache, syllableCounter} from "./codemirror/syllableGutter.js";
import {englishCompletions} from "./codemirror/completions.js";
import {phoneticRhymeHighlighter} from "./codemirror/rhymeHighlighter.js";

// --- Editor Content Tracking ---
export let latestEditorContent = "";

export function updateEditorContentFromView(editorView, windowEditor) {
    if (typeof editorView !== "undefined" && editorView && editorView.state) {
        latestEditorContent = editorView.state.doc.toString();
    } else if (windowEditor && typeof windowEditor.getValue === "function") {
        latestEditorContent = windowEditor.getValue();
    }
}

export function attachEditorUpdate(editorView, windowEditor, updateFn) {
    if (typeof editorView !== "undefined" && editorView && editorView.state) {
        editorView.dispatch = ((origDispatch => tr => {
            origDispatch(tr);
            updateFn();
        })(editorView.dispatch.bind(editorView)));
        updateFn();
    } else if (windowEditor && typeof windowEditor.on === "function") {
        windowEditor.on("change", updateFn);
        updateFn();
    }
}

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
        rhymeCompartment.of([phoneticRhymeHighlighter]),
        syllableCompartment.of([syllableCounter()]),
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

attachEditorUpdate(window.editorView, window.editor, () => updateEditorContentFromView(window.editorView, window.editor));

initializeUIElements();