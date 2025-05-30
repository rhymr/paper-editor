import {checkAndUpdateForContent, saveEditorContent} from "./utils/util";
import {documentId, setAutoSave, setDocumentId} from "./config/config";

let editorView = null;

export function setEditorView(view) {
    editorView = view;
    window.editorView = editorView; // Expose editorView globally for debugging
}

export function initializeUIElements(view) {
    /** NavBar File Buttons */
    const saveButton = document.getElementById('saveButton');
    saveButton.addEventListener('click', saveContent);

    const newButton = document.getElementById('newButton');
    newButton.addEventListener('click', newFile);

    const openButton = document.getElementById('openFileButton');
    const openInput = document.getElementById('fileInput');
    openButton.addEventListener('click', function() {
        openInput.click(); // Trigger file input
    });
    openInput.addEventListener('change', openFile);

    /** Toggle Fullscreen Button */
    const fullscreenButton = document.getElementById('toggleFullscreen');
    fullscreenButton.addEventListener('click', toggleFullscreen);

    /** Dropdown Hover Behaviour */
    const dropdownElements = document.querySelectorAll('.dropdown');
    dropdownElements.forEach(dropdownElement => {
        dropdownElement.addEventListener('mouseenter', dropdownMouseEnter);
        dropdownElement.addEventListener('mouseleave', dropdownMouseLeave);
    });

    /** Window Load Event */
    window.onload = onLoadWindow;
}

function saveContent() {
    const content = editorView.state.doc.toString(); // Get content from CodeMirror
    if (!content) return;

    const blob = new Blob([content], {type: 'text/plain'});
    const filename = prompt("Enter a filename for the text file:", "");
    if (!filename) return; // Exit if no filename is provided

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = filename; // Use the provided filename
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function newFile() {
    // Save the current content with the existing UUID
    const currentContent = editorView.state.doc.toString();
    if (documentId) {
        saveEditorContent(currentContent, documentId);
    }

    // Disable auto-save temporarily
    setAutoSave(false);

    // Clear the editor content
    editorView.dispatch({
        changes: { from: 0, to: editorView.state.doc.length, insert: '' }
    });

    // Close any open dropdowns
    const openDropdowns = document.querySelectorAll('.dropdown-content.show');
    openDropdowns.forEach(dropdown => {
        dropdown.classList.remove('show');
    });

    // Reset the URL without the UUID
    const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
    window.history.replaceState({ path: newUrl }, '', newUrl);

    // Reset the currentDocumentUUID for a new file
    setDocumentId(null)

    // Re-enable auto-save
    setTimeout(() => {
        setAutoSave(true);
    }, 0);
}

function openFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        const lineDelimiter = '\n';
        const chunkSize = 500; // Smaller chunk size
        const trimmedContent = content.trim(); // Remove trailing spaces

        // Clear the original content before inserting
        editorView.dispatch({
            changes: { from: 0, to: editorView.state.doc.length, insert: '' }
        });

        const lines = trimmedContent.split(lineDelimiter);
        let start = 0;

        function insertChunk() {
            const end = Math.min(start + chunkSize, lines.length);
            const chunk = lines.slice(start, end).join(lineDelimiter);

            // Insert the chunk into the editor
            editorView.dispatch({
                changes: { from: editorView.state.doc.length, insert: chunk }
            });

            start = end;

            if (start < lines.length) {
                // Continue inserting the next chunk
                requestAnimationFrame(insertChunk);
            } else {
                // Insertion is complete, show a warning if needed
                if (lines.length > 1000) {
                    alert("Syllable counter is disabled after 1000 lines.");
                }
            }
        }

        insertChunk(); // Start inserting chunks
    };
    reader.readAsText(file);
}

/** Toggle Fullscreen Function */
function toggleFullscreen() {
    let documentElement = document.documentElement;

    if (documentElement.requestFullscreen) {
        documentElement.requestFullscreen();
    } else if (documentElement.webkitRequestFullscreen) { /* Safari */
        documentElement.webkitRequestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) { /* IE11 */
        documentElement.msRequestFullscreen();
    }

    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) { /* Safari */
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { /* IE11 */
        document.msExitFullscreen();
    }
}

/** Dropdown Hover Behaviour - Start */
function dropdownMouseEnter()  {
    // Add 'show' class to dropdown content
    this.querySelector('.dropdown-content').classList.add('show');

    // Hide CodeMirror's autocomplete box
    const autocompleteBox = document.querySelector('.cm-tooltip-autocomplete');
    if (autocompleteBox) {
        autocompleteBox.style.display = 'none';
    }
}

function dropdownMouseLeave() {
    // Remove 'show' class from dropdown content
    this.querySelector('.dropdown-content').classList.remove('show');

    // Show CodeMirror's autocomplete box again
    const autocompleteBox = document.querySelector('.cm-tooltip-autocomplete');
    if (autocompleteBox) {
        autocompleteBox.style.display = '';
    }
}
/** Dropdown Hover Behaviour - End */

/** Window Load Event */
function onLoadWindow() {
    const uuid = new URLSearchParams(window.location.search).get('id');

    if (!uuid) {
        return;
    }

    const content = localStorage.getItem(uuid);
    const empty = content.trim() === '' || !content;

    if (content && !empty) {
        // Content is not empty, load it into the editor
        setDocumentId(uuid);

        editorView.dispatch({
            changes: { from: 0, to: editorView.state.doc.length, insert: content }
        });

        checkAndUpdateForContent(content); // This will update the URL if needed
        return;
    }

    // Content is empty, remove from localStorage and reset URL
    localStorage.removeItem(uuid);

    const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
    window.history.replaceState({ path: newUrl }, '', newUrl);

    setDocumentId(null)
}