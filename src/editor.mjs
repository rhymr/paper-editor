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
import {openaiApiKey, setApiKey, fetchModels} from "./api/openai.js";
import {handleChatSubmit, addUserMessage} from "./chatbox.js";
import {renderMarkdown} from "./utils/markdown.js";
import {phoneticRhymeHighlighter} from "./codemirror/rhymeHighlighter.js";
import {initBottomSectionRhymeZone} from "./rhymezone.js";

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

// --- UI/Chat/Model Logic ---
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');

const apikeyForm = document.getElementById('apikey-form');
const apikeyInput = document.getElementById('apikey-input');
const spyToggle = document.getElementById('spy-toggle');
const apikeySave = document.getElementById('apikey-save');

if (openaiApiKey) {
    apikeyInput.value = openaiApiKey;
}

spyToggle.addEventListener('click', function() {
    if (apikeyInput.type === 'password') {
        apikeyInput.type = 'text';
        spyToggle.textContent = '🙈';
    } else {
        apikeyInput.type = 'password';
        spyToggle.textContent = '👁️';
    }
});

apikeyForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const key = apikeyInput.value.trim();
    if (key) {
        setApiKey(key);
        apikeySave.textContent = 'Saved';
        setTimeout(() => {
            apikeySave.textContent = 'Save';
        }, 1500);
        fetchModels(selectedModel, modelSelect);
    }
});

const modelSelect = document.getElementById('model-select');
let selectedModel = modelSelect.value;
modelSelect.addEventListener('change', function() {
    selectedModel = modelSelect.value;
});

if (openaiApiKey) {
    fetchModels(selectedModel, modelSelect);
}

chatInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

chatInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatForm.dispatchEvent(new Event('submit', {cancelable: true, bubbles: true}));
    }
});

attachEditorUpdate(window.editorView, window.editor, () => updateEditorContentFromView(window.editorView, window.editor));

chatForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const msg = chatInput.value.trim();
    if (!msg) return;
    addUserMessage(msg, chatMessages, renderMarkdown);
    chatInput.value = '';
    chatInput.style.height = 'auto';
    await handleChatSubmit({
        msg,
        chatMessages,
        renderMarkdown,
        latestEditorContent,
        selectedModel
    });
});

// Initialize advanced rhyme zone UI in bottom section
window.addEventListener("DOMContentLoaded", () => {
    initBottomSectionRhymeZone();
});

initializeUIElements();