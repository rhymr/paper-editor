import {documentId, setDocumentId} from "../config/config";

export function generateUUID() {
    return 'xxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export function checkAndUpdateForContent(content) {
    // Check if the content is empty
    if (content.trim() === '') {
        // If content is empty and there's a UUID in the URL, remove it from localStorage and the URL
        if (documentId) {
            localStorage.removeItem(documentId); // Remove from localStorage
            const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
            window.history.replaceState({ path: newUrl }, '', newUrl);
        }
        setDocumentId(null);
    } else {
        // Content is not empty, proceed to save and update URL
        setDocumentId(saveEditorContent(content, documentId));
    }
}

export function saveEditorContent(editorContent, uuid = null) {
    uuid = uuid || generateUUID();

    localStorage.setItem(uuid, editorContent);

    const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?id=${uuid}`;
    window.history.replaceState({ path: newUrl }, '', newUrl);

    return uuid; // Return the UUID for future reference
}